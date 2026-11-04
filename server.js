const express = require('express');
const sql = require('mssql/msnodesqlv8');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const config = {
    connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=localhost\\SQLEXPRESS;Database=biletsatışsitesi;Trusted_Connection=yes;Encrypt=no;TrustServerCertificate=yes;'
};


app.get('/api/etkinlikler/:id', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT 
                    e.*, k.KategoriAdi, s.SalonAdi,
                    CONVERT(varchar(5), e.Saat, 108) AS FormatliSaat
                FROM Etkinlikler e
                LEFT JOIN Kategoriler k ON e.KategoriID = k.KategoriID
                LEFT JOIN Salonlar s ON e.SalonID = s.SalonID
                WHERE e.EtkinlikID = @id
            `);

        if (result.recordset.length > 0) {
            const item = result.recordset[0];
            res.json({
                ID: item.EtkinlikID,
                EtkinlikAdi: item.EtkinlikAdi,
                Tarih: new Date(item.Tarih).toLocaleDateString('tr-TR'),
                Saat: item.FormatliSaat || "00:00",
                Fiyat: item.Fiyat,
                Kategori: item.KategoriAdi || "Genel",
                Mekan: item.SalonAdi || "Bilinmeyen Salon"
            });
        } else { res.status(404).send("Bulunamadı"); }
    } catch (err) { res.status(500).send(err.message); }
});


app.get('/api/dolu-koltuklar/:etkinlikId', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.etkinlikId)
            .query('SELECT KoltukNo FROM Biletler WHERE EtkinlikID = @id');
        res.json(result.recordset.map(r => r.KoltukNo));
    } catch (err) { res.status(500).send(err.message); }
});


app.post('/api/bilet-al', async (req, res) => {
    try {
        const { EtkinlikID, Koltuklar } = req.body;
        let pool = await sql.connect(config);
        for (let koltuk of Koltuklar) {
            await pool.request()
                .input('eid', sql.Int, EtkinlikID)
                .input('kno', sql.NVarChar, koltuk)
                .query('INSERT INTO Biletler (EtkinlikID, KoltukNo, SatinAlmaTarihi) VALUES (@eid, @kno, GETDATE())');
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');


app.post('/api/iletisim', async (req, res) => {
    const { adSoyad, eposta, mesaj } = req.body;
    console.log("Yeni mesaj alındı:");
    console.log("Ad:", adSoyad);
    console.log("Mail:", eposta);
    console.log("Mesaj:", mesaj);

    res.json({ success: true, message: "Mesajınız başarıyla gönderildi!" });
});
app.listen(3000, () => console.log('🚀 Sunucu http://localhost:3000 üzerinde çalışıyor.'));