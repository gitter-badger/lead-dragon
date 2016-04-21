var request = require('request');
var cheerio = require('cheerio');


exports.scrapeRelevantUrls = function scrapeRelevantUrls(html, cb) {
  var $ = cheerio.load(html);
  var links = $(".r a");

  if (!links) {
    // console.log($('body').html());
    cb(null, $('body').html());

  } else {
    var websiteList = [];
    var totalResults = 0;
    links.each(function (i, link) {
      // get the href attribute of each link
      var url = $(link).attr("href");
      // strip out unnecessary junk
      url = url.replace("/url?q=", "").split("&")[0];
      totalResults++;
      console.log("" + " " + totalResults + url);
      if (url.charAt(0) === "/") {
        return;
      }
      websiteList.push(url);
      // download that page
    });
    cb(null, websiteList);
  }
}

exports.getEmailsFromPage = function getEmailsFromPage(url, cb) {
  request(url, function (error, response, body) {
    console.log("Making request to " + url);
    if (error || response.statusCode != 200) {
      cb("Error in downloading page", null);
      return;
    }
    // load the page into cheerio
    var $page = cheerio.load(body),
      text = $page("body").text();

    var emails = extractEmails(text);
    cb(null, emails);
  });
}


extractEmails = function extractEmails(text) {
  return text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
}