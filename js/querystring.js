// QueryString: obtains the URL query parameters
// ref: http://stackoverflow.com/questions/979975/how-to-get-the-value-from-the-url-parameter

const QueryString = function () {
  // This function is anonymous, is executed immediately and
  // the return value is assigned to QueryString!
  const query_string = {};
  const query = window.location.search.substring(1);
  const vars = query.split('&');
  for (let i = 0; i < vars.length; i++) {
    const [name, val] = vars[i].split('=');
    // If first entry with this name
    if (typeof query_string[name] === 'undefined') {
      query_string[name] = decodeURIComponent(val);
      // If second entry with this name
    } else if (typeof query_string[name] === 'string') {
      query_string[name] =
        [query_string[name], decodeURIComponent(val)];
      // If third or later entry with this name
    } else {
      query_string[name].push(decodeURIComponent(val));
    }
  }
  return query_string;
}();
