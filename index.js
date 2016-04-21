var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();
var ScrapHelper = require('./lib/ScrapHelper');

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  // Let's scrape it
  skip = req.query.skip || 0;
  count = req.query.count || 100;
  query = req.query.q;
  email = req.query.email;
  
  if (!query) {
    res.render('home', { count: count, email: email });
    return;
  }
  // query = "media agencies gurgaon contact";
  if (count < 100) {
    totalPageCount = 0;
    reusltsPerPage = count;
  } else {
    reusltsPerPage = 100;
    totalPageCount = Math.ceil(count / 100);
  }

  for (page = 0; page < totalPageCount; page++) {
    var date = new Date();
    filename = query.replace(/[^A-Z0-9]+/ig, "_")+"_leads_"+totalPageCount+"_page_"+page+"_dm"+date.getDate()+date.getMonth()+"h"+date.getHours()+"__"+date.getTime()+".xls";
    sourceUrl = 'https://www.google.co.in/search?q=' + query + "&start=" + page + "&num=" + reusltsPerPage;
    // sourceUrl = "http://api.ipify.org";
    console.log("Starting crawling");
    scrapePageToGetEmails(sourceUrl, filename, function (err, result) {
      if (err) {
        // res.send(err);
        return;
      }
      // res.send(result);
    });
  }
  res.render('home', { q: query, count: count, email: email });
});


app.listen('80')
console.log('Magic happens on port 80');
exports = module.exports = app;


function scrapePageToGetEmails(sourceUrl, filename, cb) {
  var totalEmailCount = 0;
  var emailNotFound = 0;
  var totalTime = 0;
  // var searchRequestFailed = 0;
  var linkVisits = 0;
  var linkVisitRequestFailed = 0;
  console.log("Making request to " + sourceUrl);
  var startTime = new Date().getTime();
  request({
    url: sourceUrl
  }, function (error, response, html) {
    if (!error && response.statusCode == 200) {
      console.log("Search page loaded");

      ScrapHelper.scrapeRelevantUrls(html, filename, function (err, websiteList) {
        if (!err && websiteList) {
          //Create an xls file
          var writeStream = fs.createWriteStream(filename);
          writeStream.write("Website" + "\t" + "Email" + "\t" + "Name" + "\n");
          //Get email from each page
          websiteList.forEach(function (url) {
            ScrapHelper.getEmailsFromPage(url, function (err, emails) {
              linkVisits++;
              if (!err) {
                if (emails) {
                  console.log("emails " + emails);
                  totalEmailCount = totalEmailCount + emails.length;
                  writeStream.write(url + "\t" + emails.toString() + "\t" + "" + "\n");
                } else {
                  emailNotFound++;
                  writeStream.write(url + "\t" + "NotAvailable" + "\t" + "" + "\n");
                }
              } else {
                linkVisitRequestFailed++;
                console.log("Couldn’t get page because of error: " + error);
                console.log("Links visited " + linkVisits + "\t" + "Link visits failed " + linkVisitRequestFailed);
              }
              console.log("Links visited " + linkVisits + "\t" + "Link visits failed " + linkVisitRequestFailed);
            });
          });
        } else {
          console.log("Error in scraping urls", null);
        }
      });
      cb(null, "Downloading emails for ya");

    } else {
      cb({ errorMessage: response.statusCode + " returned " + error, success: false }, null);
    }

  });
}
