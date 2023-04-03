const express = require('express')
const bodyparser = require('body-parser')
const fs = require('fs');
const path = require('path')
const mysql = require('mysql')
const multer = require('multer')
const csv = require('fast-csv');

const app = express()
app.use(express.static("./public"))

app.use(bodyparser.json())
app.use(bodyparser.urlencoded({ extended: true }))

// Database connection  createpool
const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "mydb"
})

db.getConnection(function (err) {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to database.');
})

var storage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, './uploads/')
    },
    filename: (req, file, callBack) => {
        callBack(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})

var upload = multer({
    storage: storage
});

console.log(__dirname + '/email.html')
app.get('/', (req, res) => {
    try {
        console.log(__dirname + '/email.html')
        res.sendFile(__dirname + '/email.html');
    }
    catch (err) {
        console.log(err)
    }
});


app.post('/mea', upload.single('import-csv'), (req, res) => {
    return res.json({ message: "uploded" })
})

app.post('/import-csv', upload.single("import-csv"), (req, res) => {
    console.log(req.file);

    uploadCsv(__dirname + '/uploads/' + req.file.filename);

});

function uploadCsv(uriFile) {
    let stream = fs.createReadStream(uriFile);
    let csvDataColl = [];
    let fileStream = csv
        .parse()
        .on("data", function (data) {
            csvDataColl.push(data);
        })
        .on("end", function () {
            csvDataColl.shift();
            // console.log(csvDataColl)

            db.getConnection((error) => {
                if (error) {
                    console.error(error);
                } else {
                    console.log("he;p")

                    let query = 'INSERT INTO users_email (id,name,email) VALUES ?';
                    db.query(query, [csvDataColl], (error, res) => {
                        console.log(error || res);
                    });

                }
            });

            // fs.unlinkSync(uriFile)  //upload file only one time in local storage
        });

    stream.pipe(fileStream);
}

// const PORT = process.env.PORT || 5555
app.listen(5555, () => { console.log(`Node app serving on port: ${5555}`) })