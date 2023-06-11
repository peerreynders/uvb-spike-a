var q=Object.defineProperty,W=(s,e,t)=>e in s?q(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t,N=(s,e,t)=>(W(s,typeof e!="symbol"?e+"":e,t),t),C=(s,e,t)=>{if(!e.has(s))throw TypeError("Cannot "+t)},r=(s,e,t)=>(C(s,e,"read from private field"),t?t.call(s):e.get(s)),u=(s,e,t)=>{if(e.has(s))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(s):e.set(s,t)},a=(s,e,t,n)=>(C(s,e,"write to private field"),n?n.call(s,t):e.set(s,t),t);import{Assertion as A}from"./assert.mjs";import"dequal";import"diff";const R="uvb-report:ready",D=new Intl.NumberFormat([],{maximumFractionDigits:2,minimumFractionDigits:2,style:"unit",unit:"millisecond",unitDisplay:"short"}),F=s=>s.trim();function I(s){const e=s?.indexOf(`
`)??-1;return e<0?"":s.substring(e).split(`
`).map(F).join(`
`)}function P(s){const[e,t,n]=s;let i="",o="",d="";return e instanceof Error?(e.name&&(i=e.name),e.message&&(i=i?`${i}: ${e.message}`:e.message),e instanceof A&&e.operator&&(o=e.operator),typeof e.stack=="string"&&(d=I(e.stack))):typeof e=="string"?i=e:i=String(e),{suiteName:n,testName:t,message:i,operator:o,stack:d}}function g(s){const e=document.getElementById(s);if(!(e instanceof HTMLTemplateElement))throw new Error("${id} template not found");return e}const B="uvub-suite";let L;const O=()=>L||(L=g(B)),U="uvub-report-failure";let H;const _=()=>H||(H=g(U));var c,h,p,v;class V{constructor(e){u(this,c,void 0),u(this,h,void 0),u(this,p,void 0),u(this,v,void 0),N(this,"render",()=>{if(r(this,c)!==void 0){for(const t of r(this,h))switch(t.kind){case"suite-start":r(this,c).renderSuiteStart(t.name);break;case"suite-test":r(this,c).renderSuiteTest(t.passed);break;case"suite-result":r(this,c).renderSuiteResult(t.selected,t.passed,t.skipped,t.errors.map(P));break;case"end-result":{const n=`${t.endResult.total}`,i=`${t.endResult.done}`,o=`${t.endResult.skipped}`,d=D.format(t.endResult.duration);r(this,c).renderSummary({withErrors:t.endResult.withErrors,withSkips:t.endResult.skipped>0,total:n,passed:i,skipped:o,duration:d});break}}a(this,p,void 0),r(this,h).length=0}}),a(this,c,e),a(this,h,[]),a(this,p,void 0),a(this,v,void 0)}suiteStart(e){r(this,c)!==void 0&&(r(this,h).push({kind:"suite-start",name:e}),this.scheduleRender())}suiteResult(e,t,n,i){console.log("suiteResult",e,t,n,i),r(this,c)!==void 0&&(r(this,h).push({kind:"suite-result",selected:t,passed:n,skipped:i,errors:e}),this.scheduleRender())}testPass(){r(this,c)!==void 0&&(r(this,h).push({kind:"suite-test",passed:!0}),this.scheduleRender())}testFail(){r(this,c)!==void 0&&(r(this,h).push({kind:"suite-test",passed:!1}),this.scheduleRender())}result(e){r(this,c)!==void 0&&(r(this,h).push({kind:"end-result",endResult:e}),this.scheduleRender())}isAttached(){return r(this,c)!==void 0}detach(){r(this,p)&&clearTimeout(r(this,p)),a(this,p,void 0),r(this,h).length=0,a(this,c,void 0),r(this,v)&&r(this,v).call(this),a(this,v,void 0)}onDetach(e){a(this,v,e)}scheduleRender(){r(this,p)||a(this,p,setTimeout(this.render))}}c=new WeakMap,h=new WeakMap,p=new WeakMap,v=new WeakMap;function Y(s,e){var t;const n=(t=O().content.firstElementChild)==null?void 0:t.cloneNode(!0);if(!(n instanceof HTMLTableRowElement))throw new Error("prepareSuite: Incorrect root type");const i=n.querySelector("th"),o=n.querySelector(".js-uvb-report-test-count"),d=n.querySelector(".js-uvb-report-test-indicator");if(!(i instanceof HTMLTableCellElement&&o instanceof HTMLTableCellElement&&d instanceof HTMLTableCellElement))throw new Error("prepareSuite: Missing references");const l=`suite${e}`;return i.setAttribute("id",l),i.textContent=s,o.headers=l,d.headers=l,[n,{header:i,count:o,indicators:d,id:l,outcomes:[]}]}function z(s,e){s.outcomes.push(e?"\u2022":"\u2718");const t=s.outcomes.join(" ");s.indicators.innerHTML=t}function G(s,e,t,n,i){s.count.textContent=`(${t}/${e})`;const o=i>0?"uvb-report--fail":n>0?"uvb-report--skip":"uvb-report--pass";s.count.classList.add(o)}function J(s,e,t,n,i){var o,d;const l=(o=_().content.firstElementChild)==null?void 0:o.cloneNode(!0);if(console.log(l),!(l instanceof HTMLTableSectionElement))throw new Error("renderTestFailure: Incorrect root type");const k=l.querySelector("th"),S=l.querySelector("td"),y=l.querySelector("span");if(!(k instanceof HTMLTableCellElement&&S instanceof HTMLTableCellElement&&y instanceof HTMLSpanElement))throw new Error("renderTestFailure: Missing references");const M=`fail${t}`,x=`suite${e}`;if(k.setAttribute("id",M),k.textContent=s,S.headers=`${x} ${M}`,i){y.textContent=`(${i})`;const j=document.createTextNode(`${n} `);(d=y.parentNode)==null||d.insertBefore(j,y)}else S.textContent=n;return Array.from(l.children)}function K(s,e,t){const n=`fail${e}`,i=`suite${s}`,o=document.createElement("template");o.innerHTML=`<tr>
     <td class="uvb-report-error-stack" headers="${i} ${n}">
       <pre>${t}</pre>
     </td>
   </tr>`;const d=o.content.firstChild;if(!(d instanceof HTMLTableRowElement))throw new Error("renderErrorStack: Incorrect root type");return d}const Q=(()=>{const s=document.createElement("template");return s.innerHTML=`<table>
  <tbody>
    <tr>
      <th id="total">Total</th>
      <td class="js-uvb-report-total" headers"total"></td>
    </tr>
    <tr>
      <th id="passed">Passed</th>
      <td class="js-uvb-report-passed" headers="passed"></td>
    </tr>
    <tr>
      <th id="skipped">Skipped</th>
      <td class="js-uvb-report-skipped" headers="skipped"></td>
    </tr>
    <tr>
      <th id="duration">Duration</th>
      <td class="js-uvb-report-duration" headers="duration"></td>
    </tr>
  </tbody>
</table>`,s.content})();function $(){const s=Q.cloneNode(!0).firstChild;if(!(s instanceof HTMLTableElement))throw new Error("prepareSummary: Incorrect root type");const e=s.querySelector(".js-uvb-report-total"),t=s.querySelector(".js-uvb-report-passed"),n=s.querySelector(".js-uvb-report-skipped"),i=s.querySelector(".js-uvb-report-duration"),o=s.querySelector("tbody");if(!(e instanceof HTMLTableCellElement&&t instanceof HTMLTableCellElement&&n instanceof HTMLTableCellElement&&i instanceof HTMLTableCellElement&&o instanceof HTMLTableSectionElement))throw new Error("prepareSummary: Missing references");const d=t.parentElement;if(!(d instanceof HTMLTableRowElement))throw new Error("prepareSummary: Missing references 2");return[s,{total:e,passedRow:d,passed:t,skipped:n,duration:i,tbody:o}]}function X(s,e){const{total:t,passed:n,passedRow:i,skipped:o,duration:d}=s;t.textContent=e.total,n.textContent=e.passed;const l=i.classList;e.withErrors?(l.remove("uvb-report--pass"),l.add("uvb-report--fail")):(l.remove("uvb-report--fail"),l.add("uvb-report--pass")),o.textContent=e.skipped;const k=o.classList;e.withSkips?k.add("uvb-report--skip"):k.remove("uvb-report--skip"),d.textContent=e.duration}var E,m,b,f,w,T;class Z extends HTMLElement{constructor(){super(),u(this,E,void 0),u(this,m,void 0),u(this,b,void 0),u(this,f,void 0),u(this,w,void 0),u(this,T,void 0),a(this,E,!1),a(this,m,0),a(this,b,0);const[e,t]=$();this.replaceChildren(e),a(this,f,t)}connectedCallback(){this.isConnected&&this.dispatchEvent(new CustomEvent(R,{bubbles:!0}))}disconnectedCallback(){this.detach()}detach(){r(this,T)&&(r(this,T).detach(),a(this,T,void 0))}get reporter(){return this.detach(),a(this,T,new V(this)),r(this,T)}resetSummary(){a(this,E,!1),a(this,m,0);const[e,t]=$();this.replaceChildren(e),a(this,f,t)}renderSuiteStart(e){r(this,E)&&this.resetSummary();const[t,n]=Y(e,r(this,m));r(this,f).tbody.append(t),a(this,w,n),a(this,m,r(this,m)+1)}renderSuiteTest(e){if(r(this,w)===void 0)throw new Error("renderSuiteTest: expected suite");z(r(this,w),e)}renderSuiteResult(e,t,n,i){if(r(this,w)===void 0)throw new Error("renderSuiteTest: expected suite");G(r(this,w),e,t,n,i.length);for(const o of i){const d=J(o.testName,r(this,m),r(this,b),o.message,o.operator);if(r(this,f).tbody.append(...d),o.stack){const l=K(r(this,m),r(this,b),o.stack);r(this,f).tbody.append(l)}a(this,b,r(this,b)+1)}}renderSummary(e){a(this,E,!0),r(this,f)!==void 0&&X(r(this,f),e)}}E=new WeakMap,m=new WeakMap,b=new WeakMap,f=new WeakMap,w=new WeakMap,T=new WeakMap;export{R as UVB_REPORT_READY,Z as UvbReport};
