var express = require('express');
var app = express();

//  HTTP REQUEST
const axios = require('axios');
//  File System: 파일 만들때 사용
const fs = require('fs');
//  HTTP 응답으로 기사를 받아옴 -> 분리하는데 사용함 (크롤링)
const cheerio = require('cheerio')
// Post 요청을 만들기 위해 사용
const qs = require('qs')
var total = []
var article = "";
var kor_article = "";
//  html을 동적으로 변경하기 위해 사용
let ejs = require('ejs')

app.use(express.static(__dirname + '/public'));


// Routing!!!!!
app.get('/', function (req, res) {
    res.sendFile(__dirname+'/index.html');
});

app.get('/result', (req, res, next) =>{
    const eng_article = fs.readFileSync('./article.txt', {encoding: "utf8"});
    const kor_article = fs.readFileSync('./translate_article.txt', {encoding: "utf8"});
    ejs.renderFile('./translate.ejs', {eng: eng_article, kor: kor_article}, function(err, str){
        res.send(str)
    });
});

// File Download를 위한 Router
app.get('/download_eng', (req, res, next) => {
    res.download('./article.txt');
});

app.get('/download_kor', (req, res, next) => {
    res.download('./translate_article.txt');
});


app.get('/translator', function(req, res){
    //  HTTP GET 요청
    const resObj = res;
    const article_url = req.query.news_url
    console.log(article_url);

    axios.get(article_url)
        //  Promise
        .then(function (response) {
            const stream = fs.createWriteStream("./article.txt");
            const $ = cheerio.load(response.data)

            // 기사의 타이틀을 저장
            stream.write($('article>h1').text()+ "\r\n\r\n\r\n")
            total.push($('article>h1').text()+"\r\n\r\n\r\n")
    
            // Class 
            $('.story-body>p').each(function(index, element){
                stream.write($(element).text() + "\r\n\r\n")
                total.push($(element).text()+"\r\n\r\n");
            });
            stream.close();
        }).then(function(){
            for(var i=0; i<total.length; i++) {
                article += total[i] 
            }
        }).then(function(){
            // 번역 기능
            const url = "https://openapi.naver.com/v1/papago/n2mt"

            var data = {
                source: 'en',
                target: 'ko',
                text: article
            };
        
            var options = {
                method: 'POST',
                headers: { 
                    'content-type': 'application/x-www-form-urlencoded',
                    'X-Naver-Client-Id': 'wvI3bj8R4EiRLb1Dif9l',
                    'X-Naver-Client-Secret': 'xMFde6PvQC'
                },
                data: qs.stringify(data),
                url
            };

            axios(options).then(function(res){
                const stream = fs.createWriteStream("./translate_article.txt");
                stream.write(res['data']['message']['result']['translatedText'])
                // console.log(res['data']['message']['result']['translatedText'])
                kor_article = res['data']['message']['result']['translatedText'];
            }).catch(function(err){
                console.log(err);
            })
        }).then(function(){
            // 결과 페이지로 이동
            resObj.redirect('/result')
        })
    });


app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});