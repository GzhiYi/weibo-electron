import React, { useState, useEffect, useRef } from 'react';
import { shell } from 'electron';
const superagent = require('superagent');
const cheerio = require('cheerio');





export default function Home() {
  let [historyList] = useState([]);
  let [result] = useState([])

  function compare(history: any[], newList: any[]) {
    const newListArr = newList.map(item => item.title);
    const oldListArr = history.map(item => item.title);
    let difference: any[] = []
    if (historyList.length) {
      newListArr.forEach((item, index) => {
        if (!oldListArr.includes(item)) {
          difference.push({
            title: item,
            url: newList[index].url,
            index
          });
        }
      })
      if (difference.length) {
        result = difference
        const noti = new Notification(`新热搜`, {
          body: `[top${difference[0].index + 1}]` + difference.map(item => item.title).toString(),
          requireInteraction: true
        });
        noti.onclick = function(event: { preventDefault: () => void }) {
          event.preventDefault();
          shell.openExternal(`https://s.weibo.com${difference[0].url[0] !== '/' ? '' : difference[0].url}`);
        };
      }

    }
  }

  function useInterval(callback: (() => void) | undefined, delay: number | null) {
    const savedCallback = useRef();

    // Remember the latest function.
    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
      function tick() {
        savedCallback.current();
      }
      if (delay !== null) {
        let id = setInterval(tick, delay);
        return () => clearInterval(id);
      }
    }, [delay]);
  }

  function fetchWeiboInfo() {
    try {
      superagent
        .get(`https://s.weibo.com/top/summary`)
        .end((err: any, res: { text: string }) => {
          if (err) {
            let noti = new Notification(`出错`, {
              body: err
            });
            noti.onclick = function() {};
          }
          let $ = cheerio.load(res.text);
          const weiboRankList: { title: string; url: string }[] = [];
          $('.wbs-hotrank .data td').each(
            (
              i: any,
              elem: {
                attribs: { class: string };
                children: { attribs: { href: any } }[];
              }
            ) => {
              if (elem.attribs.class === 'td-02') {
                weiboRankList.push({
                  title: elem.children[1].children[0].data,
                  url: elem.children[1].attribs.href
                });
              }
            }
          );
          function unique(arr) {
            let unique = {};
            arr.forEach(function(item) {
              unique[JSON.stringify(item)] = item; //键名不会重复
            });
            arr = Object.keys(unique).map(function(u) {
              //Object.keys()返回对象的所有键值组成的数组，map方法是一个遍历方法，返回遍历结果组成的数组.将unique对象的键名还原成对象数组
              return JSON.parse(u);
            });
            return arr;
          }
          // 去掉第一个和第三个
          weiboRankList.splice(0, 1);
          weiboRankList.splice(2, 1);
          console.log(weiboRankList);
          compare(historyList, weiboRankList);
          historyList = unique([...historyList, ...weiboRankList]);
          if (historyList.length > 1000) {
            historyList = weiboRankList;
          }
        });
    } catch (error) {
      console.log('错误', error);
      new Notification(`出现错误`, {
        body: error.toString()
      });
    }

  }
  try {
    useInterval(() => {
      fetchWeiboInfo();
    }, 29453);
  } catch (error) {
    console.log('错误外层', error);
    new Notification(`出现错误`, {
      body: error.toString()
    });
  }

  return <div></div>;
}
