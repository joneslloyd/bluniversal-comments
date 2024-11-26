var e=Object.defineProperty,t=(t,n,s)=>(((t,n,s)=>{n in t?e(t,n,{enumerable:!0,configurable:!0,writable:!0,value:s}):t[n]=s})(t,"symbol"!=typeof n?n+"":n,s),s);import"./modulepreload-polyfill-d01a6f05.js";class n extends HTMLElement{constructor(){super(),t(this,"visibleCount"),t(this,"thread"),t(this,"error"),t(this,"refreshInterval"),t(this,"postUri"),this.attachShadow({mode:"open"}),this.visibleCount=3,this.thread=null,this.error=null,this.refreshInterval=void 0}connectedCallback(){const e=this.getAttribute("post");e?(this.postUri=e,this.loadThread(this.postUri),this.startAutoRefresh()):this.renderError("Post URI is required")}disconnectedCallback(){this.stopAutoRefresh()}startAutoRefresh(){this.refreshInterval=window.setInterval((()=>{this.postUri&&this.loadThread(this.postUri,!0)}),6e4)}stopAutoRefresh(){this.refreshInterval&&clearInterval(this.refreshInterval)}async loadThread(e,t=!1){try{const n=await this.fetchThread(e);this.thread=n,this.render(),t||this.dispatchEvent(new Event("commentsLoaded"))}catch(n){if(n.message.includes("ExpiredToken")||n.message.includes("Token has expired"))try{const n=await this.refreshAccessToken(),s=await this.fetchThread(e,n);this.thread=s,this.render(),t||this.dispatchEvent(new Event("commentsLoaded"))}catch(s){this.renderError("Session expired. Please log in again."),chrome.storage.sync.remove(["blueskyAccessJwt","blueskyRefreshJwt","blueskyDid","blueskyHandle"])}else this.renderError("Error loading comments")}}async fetchThread(e,t=null){if(!e||"string"!=typeof e)throw new Error("Invalid URI: A valid string URI is required.");t||(t=await new Promise((e=>{chrome.storage.sync.get(["blueskyAccessJwt"],(t=>{e(t.blueskyAccessJwt)}))})));const n=`https://bsky.social/xrpc/app.bsky.feed.getPostThread?${new URLSearchParams({uri:e}).toString()}`,s=await fetch(n,{method:"GET",headers:{Accept:"application/json",Authorization:`Bearer ${t}`},cache:"no-store"});if(!s.ok){if((await s.text()).includes("ExpiredToken"))throw new Error("ExpiredToken");throw new Error(`Failed to fetch thread: ${s.statusText}`)}const r=await s.json();if(!r.thread)throw new Error("No comments found");return r.thread}async refreshAccessToken(){const e=await new Promise((e=>{chrome.storage.sync.get(["blueskyRefreshJwt"],(t=>{e(t.blueskyRefreshJwt)}))})),t=await fetch("https://bsky.social/xrpc/com.atproto.server.refreshSession",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`}});if(!t.ok)throw new Error("Failed to refresh access token");const n=await t.json();return chrome.storage.sync.set({blueskyAccessJwt:n.accessJwt,blueskyRefreshJwt:n.refreshJwt,blueskyDid:n.did,blueskyHandle:n.handle}),n.accessJwt}render(){var e,t,n;if(!this.thread)return void this.renderError("No comments found");const s=(this.thread.replies||[]).sort(((e,t)=>(t.post.likeCount??0)-(e.post.likeCount??0))),r=document.createElement("div");r.innerHTML=`\n      <comments>\n        <p class="reply-info">\n          Reply on Bluesky\n          <a href="https://bsky.app/profile/${null==(t=null==(e=this.thread.post)?void 0:e.author)?void 0:t.handle}/post/${null==(n=this.thread.post)?void 0:n.uri.split("/").pop()}" target="_blank" rel="noopener noreferrer">\n            here\n          </a> to join the conversation.\n        </p>\n        <div id="comments"></div>\n        <button id="show-more">\n          Show more comments\n        </button>\n      </comments>\n    `;const o=r.querySelector("#comments");o.innerHTML="",s.slice(0,this.visibleCount).forEach((e=>{o.appendChild(this.createCommentElement(e))}));const a=r.querySelector("#show-more");this.visibleCount>=s.length?a.style.display="none":a.style.display="block",a.addEventListener("click",(()=>{this.visibleCount+=5,this.render()})),this.shadowRoot.innerHTML="",this.shadowRoot.appendChild(r),this.hasAttribute("no-css")||this.addStyles()}createCommentElement(e){var t,n,s;const r=document.createElement("div");r.classList.add("comment");const o=e.post.author,a=(null==(t=e.post.record)?void 0:t.text)||"",i=(null==navigator?void 0:navigator.language)??"en-GB",c=new Date(e.post.record.createdAt).toLocaleString(i,{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});if(r.innerHTML=`\n      <div class="author">\n        <a href="https://bsky.app/profile/${o.handle}" target="_blank" rel="noopener noreferrer">\n          ${o.avatar?`<img width="22px" src="${o.avatar}" />`:""}\n          ${o.displayName??o.handle}\n        </a>\n        <p class="comment-text"><a class="comment-text" href="https://bsky.app/profile/${null==(n=e.post.author)?void 0:n.handle}/post/${null==(s=e.post.uri)?void 0:s.split("/").pop()}" target="_blank" rel="noopener noreferrer">${a}</a></p>\n        <small class="comment-meta">\n          ${e.post.likeCount??0} likes • ${e.post.replyCount??0} replies • ${c}\n        </small>\n      </div>\n    `,e.replies&&e.replies.length>0){const t=document.createElement("div");t.classList.add("replies-container"),e.replies.sort(((e,t)=>(t.post.likeCount??0)-(e.post.likeCount??0))).forEach((e=>{t.appendChild(this.createCommentElement(e))})),r.appendChild(t)}return r}renderError(e){const t=document.createElement("div");t.innerHTML=`\n      <p class="error">${e}</p>\n      <p class="no-comments">No comments yet. Be the first to start the conversation on <a href="https://bsky.app/" target="_blank">Bluesky</a>!</p>\n    `,this.shadowRoot.innerHTML="",this.shadowRoot.appendChild(t),this.addStyles()}addStyles(){const e=document.createElement("style");e.textContent="\n      comments {\n        margin: 0 auto;\n        padding: 1em;\n        max-width: 280px;\n        display: block;\n        background-color: #fff;\n        border-radius: 8px;\n        box-shadow: 0 1px 3px rgba(0,0,0,0.1);\n      }\n      .reply-info {\n        font-size: 14px;\n        margin-top: 0; \n        margin-bottom: 1.2em;\n        color: #3c4043;\n      }\n      #show-more {\n        margin-top: 10px;\n        width: 100%;\n        padding: 0.8em;\n        font: inherit;\n        box-sizing: border-box;\n        background: #1a73e8;\n        color: #fff;\n        border-radius: 4px;\n        cursor: pointer;\n        border: 0;\n      }\n      #show-more:hover {\n        background: #1669bb;\n      }\n      .comment {\n        margin-bottom: 1.5em;\n        margin-top: 1em;\n      }\n      .author a {\n        font-size: 0.9em;\n        margin-bottom: 0.4em;\n        display: inline-flex;\n        align-items: center;\n        color: #202124;\n        font-weight: bold;\n        text-decoration: none;\n      }\n      .author a:hover {\n        text-decoration: underline;\n      }\n      .author img {\n        margin-right: 0.6em;\n        border-radius: 100%;\n        vertical-align: middle;\n      }\n      .comment-text {\n        margin: 5px 0;\n        line-height: 1.4;\n        color: #3c4043;\n      }\n      .comment-text a { \n        font-weight: normal;\n      }\n      .comment-meta {\n        color: #5f6368;\n        display: block;\n      }\n      .replies-container {\n        border-left: 2px solid #e0e0e0;\n        margin-left: 1em;\n        padding-left: 1em;\n      }\n      .error {\n        color: #d93025;\n        padding: 1em;\n        text-align: center;\n      }\n      .no-comments {\n        text-align: center;\n        color: #5f6368;\n        font-size: 14px;\n        margin-top: 1em;\n      }\n\n    ",this.shadowRoot.appendChild(e)}}async function s(e,t,n,s){const r=(new Date).toISOString(),o=`Discussing "${s}"\n${n}\n\n#BlueskyComments`,a=[];function i(e){const t=new TextEncoder;t.encode(o);const n=t.encode(e),s=o.indexOf(e);if(-1===s)return null;const r=o.substring(0,s),a=t.encode(r).length;return{byteStart:a,byteEnd:a+n.length}}const c=i(n);c&&a.push({index:c,features:[{$type:"app.bsky.richtext.facet#link",uri:n}]});const l=i("#BlueskyComments");l&&a.push({index:l,features:[{$type:"app.bsky.richtext.facet#tag",tag:"BlueskyComments"}]});const d={$type:"app.bsky.feed.post",text:o,facets:a,createdAt:r},h=await fetch("https://bsky.social/xrpc/com.atproto.repo.createRecord",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({repo:e,collection:"app.bsky.feed.post",record:d})});if(!h.ok){const e=await h.text();if(e.includes("ExpiredToken"))throw new Error("ExpiredToken");throw new Error(`Failed to create post: ${h.statusText}\n${e}`)}return(await h.json()).uri}customElements.define("bsky-comments",n),document.addEventListener("DOMContentLoaded",(async()=>{const e=document.getElementById("comments-container"),t=document.getElementById("status-container"),[n]=await chrome.tabs.query({active:!0,currentWindow:!0});let r=n.url||"";const o=n.title||"";r=function(e){try{const t=new URL(e);t.hostname=t.hostname.replace(/^www\./,""),t.hash="";["utm_source","utm_medium","utm_campaign","utm_term","utm_content"].forEach((e=>t.searchParams.delete(e)));let n=t.pathname.replace(/\/+$/,"");n.startsWith("/")||(n="/"+n);return`${t.protocol}//${t.hostname}${n}${t.search}`.toLowerCase()}catch(t){return e.toLowerCase()}}(r),chrome.storage.sync.get(["blueskyAccessJwt","blueskyRefreshJwt","blueskyDid"],(async n=>{let a=n.blueskyAccessJwt;const i=n.blueskyRefreshJwt,c=n.blueskyDid;if(!a||!c)return void(t.innerHTML='<p>Please log in to Bluesky via the <a href="options.html" target="_blank">extension options</a>.</p>');let l="";try{t.innerHTML="<p>Searching for existing posts...</p>",l=await async function(e){const t=new URLSearchParams({q:e,limit:"1",sort:"top"}),n=`https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?${t.toString()}`,s=await fetch(n);if(!s.ok){const e=await s.text();throw new Error(`Failed to search for posts: ${s.statusText}\n${e}`)}const r=(await s.json()).posts||[];if(r.length>0&&r[0].uri)return r[0].uri;return null}(r)||void 0,l?t.innerHTML="<p>Loading comments from existing post...</p>":(t.innerHTML="<p>No existing post found. Creating a new post...</p>",l=await s(c,a,r,o),t.innerHTML='<p class="success">A new post has been created for this page.</p>');const n=document.createElement("bsky-comments");n.setAttribute("post",l),e.appendChild(n),n.addEventListener("commentsLoaded",(()=>{t.innerHTML=""}))}catch(d){if(d.message.includes("ExpiredToken")||d.message.includes("Token has expired"))try{a=await async function(e){const t=await fetch("https://bsky.social/xrpc/com.atproto.server.refreshSession",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`}});if(!t.ok)throw new Error("Failed to refresh access token");const n=await t.json();return chrome.storage.sync.set({blueskyAccessJwt:n.accessJwt,blueskyRefreshJwt:n.refreshJwt,blueskyDid:n.did,blueskyHandle:n.handle}),n.accessJwt}(i),l||(l=await s(c,a,r,o)),t.innerHTML='<p class="success">Session refreshed. Loading comments...</p>';const n=document.createElement("bsky-comments");n.setAttribute("post",l),e.appendChild(n),n.addEventListener("commentsLoaded",(()=>{t.innerHTML=""}))}catch(h){t.innerHTML='<p class="error">Session expired. Please log in again via the <a href="options.html" target="_blank">extension options</a>.</p>',chrome.storage.sync.remove(["blueskyAccessJwt","blueskyRefreshJwt","blueskyDid","blueskyHandle"])}else t.innerHTML=`<p class="error">Error: ${d.message}</p>`}}))}));