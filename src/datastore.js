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

Datastore.prototype.getSummary = function () {
  const { influx } = this;

  return new Promise(
    ((resolve, reject) => {
      const query = 'select value from api group by space, "name" order by time desc limit 1';

      influx.query(query, (err, results) => {
        if (err) {
          return reject(err);
        }

        if (results[0]) {
          results[0].sort((a, b) => {
            if (a.space === b.space) {
              return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
            }

            return a.space > b.space ? 1 : -1;
          });

          let last = null;

          const sorted = [];

          results[0].forEach(result => {
            const point = {
              name: result.name,
              value: result.value,
              last_updated: result.time,
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

          return resolve(sorted);
        }

        return resolve();
      });
    }),
  );
};

Datastore.prototype.setValue = function (space, name, value) {
  const { influx } = this;

  return new Promise(
    ((resolve, reject) => {
      const points = [
        [{ value }, { space, name }],
      ];

      influx.writePoints('api', points, err => {
        if (err) {
          return reject(err);
        }

        return resolve({
          name,
          value,
          last_updated: new Date().toISOString(),
        });
      });
    }),
  );
};

Datastore.prototype.setIfChanged = function (space, name, value) {
  const self = this;

  return this.getLatest(space, name)
    .then(latest => {
      if (latest && latest.value === value) {
        latest.unchanged = true;

        return latest;
      }

      return self.setValue(space, name, value);
    });
};

Datastore.prototype.getLatest = function (space, name) {
  const { influx } = this;

  return new Promise(
    ((resolve, reject) => {
      const query = 'SELECT time, value from api where "name"=\''
                    + Datastore._escapeValue(name) + '\' and space=\''
                    + Datastore._escapeValue(space) + '\' order by time desc limit 1;';

      influx.query(query, (err, results) => {
        if (err) {
          return reject(err);
        }

        if (results[0] && results[0][0]) {
          const result = results[0][0];

          return resolve({
            name,
            value: result.value,
            last_updated: result.time,
          });
        }

        return resolve();
      });
    }),
  );
};

Datastore.prototype.getHistory = function (space, name, offset, limit) {
  const { influx } = this;

  if (!limit) {
    limit = 100;
  }

  if (!offset) {
    offset = 0;
  }

  return new Promise(
    ((resolve, reject) => {
      const query = 'SELECT time, value from api where "name"=\''
                    + Datastore._escapeValue(name) + '\' and space=\''
                    + Datastore._escapeValue(space) + '\' order by time desc limit '
                    + parseInt(limit) + ' offset ' + parseInt(offset) + ';';

      influx.query(query, (err, results) => {
        if (err) {
          return reject(err);
        }

        if (results[0]) {
          return resolve(results[0].map(result => ({
            name,
            value: result.value,
            last_updated: result.time,
          })));
        }

        return resolve();
      });
    }),
  );
};

module.exports = Datastore;
