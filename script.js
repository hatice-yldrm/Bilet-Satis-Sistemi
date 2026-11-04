document.addEventListener('DOMContentLoaded', () => {

    if (document.getElementById('etkinlik-listesi')) {
        verileriHizliYukle();
    }

    if (document.getElementById('seat-map')) {
        rezervasyonBilgileriniYukle();
    }


    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelector('.filter-btn.active')?.classList.remove('active');
            button.classList.add('active');
            const filterValue = button.textContent.toLowerCase().trim();
            filterEtkinlikler(filterValue, 'category');
        });
    });


    const tarihButonu = document.getElementById('tarih-filtrele-btn');
    if (tarihButonu) {
        tarihButonu.addEventListener('click', () => {
            const secilenTarihInput = document.getElementById('tarih-sorgu').value;
            if (!secilenTarihInput) { alert("Lütfen bir tarih seçin!"); return; }
            const parcalar = secilenTarihInput.split('-');
            const formatliSecilenTarih = `${parcalar[2]}.${parcalar[1]}.${parcalar[0]}`;
            filterEtkinlikler(formatliSecilenTarih, 'date');
        });
    }
});


function filterEtkinlikler(value, type) {
    document.querySelectorAll('.event-card').forEach(card => {
        if (type === 'category') {
            const category = card.dataset.category;
            card.style.display = (value === "tümü" || category === value) ? "block" : "none";
        } else if (type === 'date') {
            const cardDate = card.dataset.date.split(' ')[0];
            card.style.display = (cardDate === value) ? "block" : "none";
        }
    });
}


async function verileriHizliYukle() {
    const CACHE_KEY = 'etkinlik_ajandasi_verisi';
    const TIME_KEY = 'son_guncelleme_zamani';
    const BIR_GUN = 24 * 60 * 60 * 1000;

    const urlParams = new URLSearchParams(window.location.search);
    const arananSehir = urlParams.get('sehir')?.toLowerCase() || "";
    const arananKategori = urlParams.get('kategori')?.toLowerCase() || "";

    const yerelVeri = localStorage.getItem(CACHE_KEY);
    const sonGuncelleme = localStorage.getItem(TIME_KEY);
    const simdi = Date.now();

    let veriler;
    if (yerelVeri && sonGuncelleme && (simdi - sonGuncelleme < BIR_GUN)) {
        veriler = JSON.parse(yerelVeri);
    } else {
        try {
            const response = await fetch('http://localhost:3000/api/etkinlikler');
            veriler = await response.json();
            if (veriler) {
                localStorage.setItem(CACHE_KEY, JSON.stringify(veriler));
                localStorage.setItem(TIME_KEY, simdi.toString());
            }
        } catch (error) {
            if (yerelVeri) veriler = JSON.parse(yerelVeri);
        }
    }

    if (veriler) {
        let filtrelenmis = veriler.filter(etkinlik => {
            const sehirUyuyor = arananSehir === "" || etkinlik.Mekan?.toLowerCase().includes(arananSehir);
            const kategoriUyuyor = (arananKategori === "" || arananKategori === "etkinliği seçiniz") ?
                true : etkinlik.Kategori?.toLowerCase().trim() === arananKategori;
            return sehirUyuyor && kategoriUyuyor;
        });
        etkinlikleriEkranaBas(filtrelenmis);
    }
}

function etkinlikleriEkranaBas(liste) {
    const eventGrid = document.getElementById('etkinlik-listesi');
    if (!eventGrid) return;
    eventGrid.innerHTML = liste.map(etkinlik => `
        <article class="event-card no-image" data-category="${etkinlik.Kategori?.toLowerCase().trim()}" data-date="${etkinlik.Tarih}">
            <div class="event-details">
                <span class="category-badge">${etkinlik.Kategori}</span>
                <h3>${etkinlik.EtkinlikAdi}</h3>
                <p><i class="fa-solid fa-calendar-days"></i> ${etkinlik.Tarih}</p>
                <p><i class="fa-solid fa-location-dot"></i> ${etkinlik.Mekan || "Mekan Belirtilmemiş"}</p>
                <div class="bottom-info">
                    <span class="price">${etkinlik.Fiyat} TL</span>
                    <a href="bilet_al.html?id=${etkinlik.ID}"><button class="buy-btn">Bilet Al</button></a>
                </div>
            </div>
        </article>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {

    if (document.getElementById('seat-map')) {
        rezervasyonBilgileriniYukle();
    }
});

let seciliKoltuklar = [];

async function rezervasyonBilgileriniYukle() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (!id) return;

    try {
        const res = await fetch(`http://localhost:3000/api/etkinlikler/${id}`);
        const etkinlik = await res.json();

        if (etkinlik) {
            document.getElementById('etkinlik-adi').innerText = etkinlik.EtkinlikAdi;
            document.getElementById('etkinlik-kategori').innerText = etkinlik.Kategori;
            document.getElementById('etkinlik-tarih').innerHTML =
                `<i class="fa-solid fa-calendar-days"></i> ${etkinlik.Tarih} - <i class="fa-solid fa-clock"></i> ${etkinlik.Saat}`;
            document.getElementById('etkinlik-mekan').innerHTML =
                `<i class="fa-solid fa-location-dot"></i> ${etkinlik.Mekan}`;

            koltukHaritasiniBas(etkinlik.Fiyat, id);
        }
    } catch (e) { console.error("Hata:", e); }
}

let isGenerating = false;

async function koltukHaritasiniBas(birimFiyat, etkinlikId) {

    if (isGenerating) return;
    isGenerating = true;

    const seatMap = document.getElementById('seat-map');
    if (!seatMap) {
        isGenerating = false;
        return;
    }

    seatMap.innerHTML = '';

    try {

        const resDolu = await fetch(`http://localhost:3000/api/dolu-koltuklar/${etkinlikId}`);
        const doluKoltuklar = await resDolu.json();

        const siralar = ['A', 'B', 'C', 'D', 'F'];
        siralar.forEach(harf => {
            for (let i = 1; i <= 20; i++) {
                const koltukNo = harf + i;
                const seat = document.createElement('div');
                seat.innerText = koltukNo;

                if (doluKoltuklar.includes(koltukNo)) {
                    seat.className = 'seat occupied';
                } else {
                    seat.className = 'seat available';
                    seat.onclick = () => {
                        seat.classList.toggle('selected');
                        if (seat.classList.contains('selected')) {
                            seciliKoltuklar.push(koltukNo);
                        } else {
                            seciliKoltuklar = seciliKoltuklar.filter(k => k !== koltukNo);
                        }
                        document.getElementById('tutar').innerText = (seciliKoltuklar.length * birimFiyat).toFixed(2);
                        document.getElementById('secilen-koltuk-yazi').innerText = seciliKoltuklar.length > 0 ? seciliKoltuklar.join(', ') : "Henüz seçilmedi";
                    };
                }
                seatMap.appendChild(seat);
            }
        });
    } catch (error) {
        console.error("Koltuklar yüklenirken hata:", error);
    } finally {

        isGenerating = false;
    }
}

async function odemeyiTamamla() {

    if (seciliKoltuklar.length === 0) return alert("Koltuk seçin!");
    const id = new URLSearchParams(window.location.search).get('id');

    const response = await fetch('http://localhost:3000/api/bilet-al', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ EtkinlikID: id, Koltuklar: seciliKoltuklar })
    });

    const sonuc = await response.json();
    if (sonuc.success) {
        alert("Ödeme tamamlandı!");
        location.reload();
    }
}
document.addEventListener('DOMContentLoaded', () => {

    const aktif = JSON.parse(localStorage.getItem("aktifKullanici"));
    if (aktif) {
        const btn = document.querySelector(".giris-button");
        if (btn) {
            btn.innerText = aktif.adSoyad;
            btn.style.background = "#059669";
        }
    }

});


async function kayitOl() {
    const adSoyad = document.getElementById('reg-name').value;
    const eposta = document.getElementById('reg-email').value;
    const sifre = document.getElementById('reg-password').value;

    if (!adSoyad || !eposta || !sifre) {
        return alert("Lütfen tüm alanları doldurun!");
    }

    let kullanicilar = JSON.parse(localStorage.getItem("kullanicilar")) || [];

    const varMi = kullanicilar.find(k => k.eposta === eposta);
    if (varMi) {
        return alert("Bu e-posta adresi zaten kayıtlı!");
    }
    kullanicilar.push({ adSoyad, eposta, sifre });
    localStorage.setItem("kullanicilar", JSON.stringify(kullanicilar));

    alert("Kayıt başarılı! Şimdi giriş yapabilirsiniz.");


    document.getElementById('reg-name').value = "";
    document.getElementById('reg-email').value = "";
    document.getElementById('reg-password').value = "";
}

async function girisYap() {
    const eposta = document.getElementById('login-email').value;
    const sifre = document.getElementById('login-password').value;

    if (!eposta || !sifre) {
        return alert("Lütfen e-posta ve şifrenizi girin!");
    }


    let kullanicilar = JSON.parse(localStorage.getItem("kullanicilar")) || [];


    const kullanici = kullanicilar.find(k => k.eposta === eposta && k.sifre === sifre);

    if (kullanici) {
        alert(`Hoş geldin, ${kullanici.adSoyad}!`);
        localStorage.setItem("aktifKullanici", JSON.stringify(kullanici));
        window.location.href = "index.html";
    } else {
        alert("Hatalı e-posta veya şifre!");
    }
}

const iletisimFormu = document.querySelector('form');
if (iletisimFormu) {
    iletisimFormu.addEventListener('submit', async (e) => {
        e.preventDefault();

        const adSoyad = iletisimFormu.querySelector('input[type="text"]').value;
        const eposta = iletisimFormu.querySelector('input[type="email"]').value;
        const mesaj = iletisimFormu.querySelector('textarea').value;

        const res = await fetch('http://localhost:3000/api/iletisim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adSoyad, eposta, mesaj })
        });

        const data = await res.json();

        if (data.success) {
            alert("Mesajınız başarıyla gönderildi!");
            iletisimFormu.reset();
        }
    });
}