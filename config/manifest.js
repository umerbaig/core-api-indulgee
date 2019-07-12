const envKey = key => {
  const env = process.env.NODE_ENV || 'localDevelopment';

  const configuration = {
    localDevelopment: {
      host: 'localhost',
      port: 8000
    },
    development: {
      host: '0.0.0.0',
      port: 8000
    },
    // These should match environment variables on hosted server
    production: {
      host: process.env.HOST,
      port: process.env.PORT
    }
  };

  return configuration[env][key];
};
console.log(__dirname);
const manifest = {
  connections: [
    {
      host: envKey('host'),
      port: envKey('port'),
      routes: {
        cors: true
      },
      router: {
        stripTrailingSlash: true
      }
    }
  ],
  registrations: [
    {
      plugin: {
        register: 'hapi-i18n',
        options: {
          locales: ['en', 'th'],
          directory: __dirname + '/../i18n',
          languageHeaderField: 'lang'
        }
      }
    },
    {
      plugin: {
        register: 'bell'
      }
    },
    {
      plugin: {
        register: 'inert'
      }
    },
    {
      plugin: {
        register: 'vision'
      }
    },
    {
      "plugin": "hapi-auth-jwt2"
    },
    {
      "plugin": "./api/middleware"
    },
    {
      plugin: './api',
      options: {
        routes: {
          prefix: '/api'
        }
      }
    },
    {
      plugin: './home'
    },
    {
      plugin: {
        register: 'good',
        options: {
          ops: { interval: 60000 },
          reporters: {
            console: [
              {
                module: 'good-squeeze',
                name: 'Squeeze',
                args: [{ error: '*' }]
              },
              {
                module: 'good-console'
              },
              'stdout'
            ]
          }
        }
      }
    },
    {
      plugin: {
        register: 'hapi-swagger',
        options: {
          schemes: ["https", "http"],
          grouping: 'tags',
          tags: [
            { name: 'customers', description: 'Customer related endpoints'  },
            { name: 'auth', description: 'Auth related endpoints'  },
            { name: 'deals', description: 'Deals related endpoints'  },
            { name: 'orders', description: 'Orders related endpoints'  },
            { name: 'categories', description: 'Categories related endpoints'  },
            { name: 'media', description: 'Media upload related endpoints'  },
            { name: 'shops', description: 'Shops related endpoints'  },
            { name: 'providers', description: 'Customer related endpoints'  }
          ]
        }
      }
    }

  ]
};

module.exports = manifest;
