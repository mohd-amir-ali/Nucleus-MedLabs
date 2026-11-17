(function (root) {
  'use strict';
  async function request(path, method = 'GET', body) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch('/api/' + path, {method, credentials:'same-origin', cache:'no-store', signal:controller.signal,
        headers: method === 'GET' ? {} : {'Content-Type':'application/json','X-Nucleus-Client':'web'},
        body: body === undefined ? undefined : JSON.stringify(body)});
      const json = await response.json();
      if (!response.ok) { const error = new Error(json.error || 'Request failed.'); error.status = response.status; throw error; }
      return json;
    } catch (error) {
      if (error.status) throw error;
      throw new Error('Cannot reach the Mac server. Check Wi-Fi and keep its Terminal open.');
    } finally { clearTimeout(timeout); }
  }
  root.NucleusAPI = {request};
})(window);
