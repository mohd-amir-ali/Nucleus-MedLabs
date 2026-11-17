(function (root) {
  'use strict';
  // A demonstration gate only. Client-side verification cannot protect private data.
  const verifier='3b4f5ee8c552c031c495c3a9503b1790375c2b4f232e12ccdcc3c793f939b317';
  function name(value) {
    return typeof value==='string' ? value.normalize('NFC').replace(/[\u0000-\u001f\u007f<>`\u202a-\u202e\u2066-\u2069]/g,'').replace(/[\u2013\u2014]/g,'-').replace(/\s+/g,' ').trim().slice(0,60) : '';
  }
  async function verify(email,password) {
    if(typeof email!=='string'||typeof password!=='string'||email.length>254||password.length>128)return false;
    if(!root.crypto?.subtle)throw new Error('Open the installed app or an HTTPS preview to use demonstration sign-in.');
    const bytes=new TextEncoder().encode(email.trim().toLowerCase()+'\n'+password);
    const digest=await root.crypto.subtle.digest('SHA-256',bytes);
    return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('')===verifier;
  }
  root.NucleusDemo=Object.freeze({name,verify});
})(window);
