import{dequal as v}from"dequal";import{diffLines as q,diffArrays as N,diffChars as O}from"diff";function R(e,t){return{kind:"arrays",diff:N(e,t)}}function y(e,t,o=0){return{kind:"lines",lineNo:o,diff:q(e,t)}}function b(e,t){return{kind:"chars",diff:O(e,t)}}function T(e,t){return{kind:"direct",actual:typeof e=="string"?e:String(e),actualType:typeof e,expected:typeof t=="string"?t:String(t),expectedType:typeof t}}const w=Object.prototype.hasOwnProperty;function x(e,t){if(typeof e!="object"||typeof t!="object")throw new Error("makeFrame: non-object arguments");return Array.isArray(e)&&(Array.isArray(t)||t==null)?{kind:"array",result:[],index:0,actual:e,expected:t}:{kind:"object",result:{},index:0,keys:Object.keys(t),actual:e,expected:t}}function I(e,t){const o=[x(e,t)];let n=o[0],r=!1,a;do if(n=o[o.length-1],a&&(n.kind==="array"?(n.result[n.index]=a.result,n.index+=1):(n.result[n.keys[n.index]]=a.result,n.index+=1),a=void 0),r=!1,n.kind==="array"){const{actual:c,expected:h,result:d}=n;for(;n.index<c.length;n.index+=1){const u=c[n.index];if(!u||typeof u!="object"){d[n.index]=u;continue}o.push(x(u,h[n.index])),r=!0;break}r||(a=o.pop())}else{const{actual:c,expected:h,keys:d,result:u}=n;for(;n.index<d.length;n.index+=1){const f=d[n.index];if(!w.call(c,f))continue;const p=c[f];if(!p||typeof p!="object"){u[f]=p;continue}o.push(x(p,h[f])),r=!0;break}if(!r){for(const f in c)w.call(u,f)||(u[f]=c[f]);a=o.pop()}}while(o.length>0);if(!a)throw new Error("sort: no result (done)");return a.result}function C(){const e=new Set;return function(t,o){return o===void 0?"[__VOID__]":typeof o=="number"&&o!==o?"[__NAN__]":typeof o=="bigint"?o.toString():!o||typeof o!="object"?o:e.has(o)?"[Circular]":(e.add(o),o)}}function k(e){return JSON.stringify(e,C(),2).replace(/"\[__NAN__\]"/g,"NaN").replace(/"\[__VOID__\]"/g,"undefined")}function _(e){return e&&typeof e=="object"?k(e):typeof e=="string"?e:void 0}function S(e,t){return e||String(t)}function A(e,t){return e||t}function $(e,t){if(Array.isArray(t)&&Array.isArray(e))return R(e,t);if(t instanceof RegExp)return b(String(e),String(t));const o=e&&typeof e=="object"&&t&&typeof t=="object"?k(I(e,t)):_(e),n=_(t);return o&&/\r?\n/.test(o)?y(o,S(n,t)):n&&/\r?\n/.test(n)?y(S(o,e),n):o&&n?b(o,n):T(A(o,e),A(n,t))}function l(e){e=e.replace(/\r?\n/g,`
`);const t=e.match(/^[ \t]*(?=\S)/gm);if(!t)return e;let o=0,n=1/0,r=(t||[]).length;for(;o<r;o++)n=Math.min(n,t[o].length);return r&&n?e.replace(new RegExp(`^[ \\t]{${n}}`,"gm"),""):e}class g extends Error{constructor(t){var o;super(t.message),this.name="Assertion",this.code="ERR_ASSERTION";const n=Error;(o=n.captureStackTrace)==null||o.call(n,this,this.constructor),this.details=t.details,this.generated=t.generated,this.operator=t.operator,this.expected=t.expected,this.actual=t.actual}}function i(e,t,o,n,r,a,c){if(!e)throw c instanceof Error?c:new g({actual:t,expected:o,operator:n,message:c||a,generated:!c,details:r?.(t,o)})}function D(e,t,o){i(v(e,t),e,t,"equal",$,"Expected values to be deeply equal:",o)}function V(e,t,o){i(!v(e,t),e,t,"not.equal",void 0,"Expected values not to be deeply equal",o)}function F(e,t,o){i(e instanceof t,e,t,"instance",void 0,`Expected value to be an instance of \`${t.name||t.constructor.name}\``,o)}function J(e,t,o){i(!(e instanceof t),e,t,"not.instance",void 0,`Expected value not to be an instance of \`${t.name||t.constructor.name}\``,o)}function j(e,t,o){i(e===t,e,t,"is",$,"Expected values to be strictly equal:",o)}function L(e,t,o){i(e!==t,e,t,"is.not",void 0,"Expected values not to be strictly equal",o)}j.not=L;function M(e,t,o){typeof t=="string"?i(e.includes(t),e,t,"match",void 0,`Expected value to include "${t}" substring`,o):i(t.test(e),e,t,"match",void 0,`Expected value to match \`${String(t)}\` pattern`,o)}function P(e,t,o){typeof t=="string"?i(!e.includes(t),e,t,"not.match",void 0,`Expected value not to include "${t}" substring`,o):i(!t.test(e),e,t,"not.match",void 0,`Expected value not to match \`${t.toString()}\` pattern`,o)}function B(e,t){const o=!!e;i(o,o,!0,"ok",void 0,"Expected value to be truthy",t)}function G(e,t,o){const n=l(e),r=l(t);i(n===r,n,r,"snapshot",y,"Expected value to match snapshot",o)}function H(e,t,o){const n=l(e),r=l(t);i(n!==r,n,r,"not.snapshot",void 0,"Expected value not to match snapshot",o)}function E(e,t,o){i(e,!1,!0,"throws",void 0,t,o)}function K(e,t,o){const n=!o&&typeof t=="string"?t:o;try{e(),E(!1,"Expected function to throw",n)}catch(r){if(r instanceof g)throw r;if(typeof t=="function"&&r instanceof Error){E(t(r),"Expected function to throw matching exception",n);return}if(t instanceof RegExp&&r instanceof Error){E(t.test(r.message),`Expected function to throw exception matching \`${String(t)}\` pattern`,n);return}}}function m(e,t,o){i(e,!0,!1,"not.throws",void 0,t,o)}function Q(e,t,o){const n=!o&&typeof t=="string"?t:o;try{e()}catch(r){if(typeof t=="function"&&r instanceof Error){m(!t(r),"Expected function not to throw matching exception",n);return}if(t instanceof RegExp&&r instanceof Error){m(!t.test(r.message),`Expected function not to throw exception matching \`${String(t)}\` pattern`,n);return}if(!t){m(!1,"Expected function not to throw",n);return}}}function U(e,t,o){const n=typeof e;i(n===t,n,t,"type",void 0,`Expected "${n}" to be "${t}"`,o)}function W(e,t,o){const n=typeof e;i(n!==t,n,t,"not.type",void 0,`Expected "${n}" not to be "${t}"`,o)}function X(e){i(!1,!0,!1,"unreachable",void 0,"Expected not to be reached!",e)}function s(e,t){i(!e,!0,!1,"not",void 0,"Expected value to be falsey",t)}s.equal=V,s.instance=J,s.match=P,s.ok=s,s.snapshot=H,s.throws=Q,s.type=W;export{g as Assertion,D as equal,F as instance,j as is,M as match,s as not,B as ok,G as snapshot,K as throws,U as type,X as unreachable};
