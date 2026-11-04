const sql = require('mssql/msnodesqlv8');

const config = {
    server: 'localhost\\SQLEXPRESS',
    database: 'biletsatışsitesi',
    options: {
        trustedConnection: true,
        trustServerCertificate: true,
        enableArithAbort: true
    },

    connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=localhost\\SQLEXPRESS;Database=BiletSatisSitesi;Trusted_Connection=yes;Encrypt=no;TrustServerCertificate=yes;'
};

const sql = require('mssql/msnodesqlv8');

const config = {
    connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=localhost\\SQLEXPRESS;Database=biletsatışsitesi;Trusted_Connection=yes;Encrypt=no;TrustServerCertificate=yes;'
};

async function baglantiyiDene() {
    try {
        console.log("Bağlanmaya çalışılıyor...");
        await sql.connect(config);
        console.log("✅ Başardın Hatice! Veritabanına bağlandık.");


        const result = await sql.query`SELECT TOP 5 * FROM Etkinlikler`;
        console.log("Tablodan gelen veriler:");
        console.table(result.recordset);

        await sql.close();
    } catch (err) {
        console.error("❌ Hata oluştu:", err.message);
    }
}

baglantiyiDene();