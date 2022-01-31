'use strict';

function Datastore(influx) {
  this.influx = influx;
}

Datastore._escapeValue = function (str) {
  // eslint-disable-next-line no-control-regex
  return str.replace(/[\0\x08\x09\x1a\n\r"'\\%]/g, char => {
    // eslint-disable-next-line default-case
    switch (char) {
    case '\0':
      return '\\0';
    case '\x08':
      return '\\b';
    case '\x09':
      return '\\t';
    case '\x1a':
      return '\\z';
    case '\n':
      return '\\n';
    case '\r':
      return '\\r';
    case '"':
    case '\'':
    case '\\':
    case '%':
      return '\\' + char;
    }
  });
};

Datastore.prototype.getSummary = async function () {
  const { influx } = this;

  const query = 'select value from api group by space, "name" order by time desc limit 1';

  const results = await influx.query(query);

  if (results[0]) {
    results.sort((a, b) => {
      if (a.space === b.space) {
        return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
      }

      return a.space > b.space ? 1 : -1;
    });

    let last = null;

    const sorted = [];

    results.forEach(result => {
      const point = {
        name: result.name,
        value: result.value,
        last_updated: new Date(result.time).toISOString(),
      };

      if (last && last.name === result.space) {
        last.members.push(point);
      } else {
        last = {
          name: result.space,
          members: [point],
        };

        sorted.push(last);
      }
    });

    return sorted;
  }

  return {};
};

Datastore.prototype.setValue = async function (space, name, value) {
  const { influx } = this;

  const points = [
    {
      measurement: 'api',
      tags: { name, space },
      fields: { value },
    },
  ];

  await influx.writePoints(points);

  return { name, value, last_updated: new Date().toISOString() };
};

Datastore.prototype.setIfChanged = async function (space, name, value) {
  const self = this;

  const latest = await self.getLatest(space, name);

  if (latest && latest.value === value) {
    latest.unchanged = true;

    return latest;
  }

  return self.setValue(space, name, value);
};

Datastore.prototype.getLatest = async function (space, name) {
  const { influx } = this;

  const query = 'SELECT time, value from api where "name"=\''
                + Datastore._escapeValue(name) + '\' and space=\''
                + Datastore._escapeValue(space) + '\' order by time desc limit 1;';

  const results = await influx.query(query);

  if (results && results[0]) {
    const result = results[0];

    return {
      name,
      value: result.value,
      last_updated: result.time,
    };
  }

  return {};
};

Datastore.prototype.getHistory = async function (space, name, offset, limit) {
  const { influx } = this;

  if (!limit) {
    limit = 100;
  }

  if (!offset) {
    offset = 0;
  }

  const query = 'SELECT time, value from api where "name"=\''
                + Datastore._escapeValue(name) + '\' and space=\''
                + Datastore._escapeValue(space) + '\' order by time desc limit '
                + parseInt(limit) + ' offset ' + parseInt(offset) + ';';

  const results = await influx.query(query);

  if (results.length > 0) {
    return results.map(result => ({
      name,
      value: result.value,
      last_updated: result.time,
    }));
  }

  return [];
};

module.exports = Datastore;
