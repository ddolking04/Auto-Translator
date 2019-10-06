//  HTTP REQUEST
const axios = require('axios');
//  File System: 파일 만들때 사용
const fs = require('fs');
//  HTTP 응답으로 기사를 받아옴 -> 분리하는데 사용함 (크롤링)
const cheerio = require('cheerio')

const article_url = "https://www.bbc.com/sport/football/49906026"

// Post 요청을 만들기 위해 사용
const qs = require('qs')

var total = []
var article = "";
  
//  HTTP GET 요청 
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
        }).catch(function(err){
            console.log(err);
        });
    })
    .catch(function (error) {
        console.log(error);
    })
    .finally(function(){
        console.log("기사 저장 완료!")
    });