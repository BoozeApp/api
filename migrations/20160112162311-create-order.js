'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.createTable('orders',
      {
        id : {
          type          : Sequelize.INTEGER,
          primaryKey    : true,
          autoIncrement : true
        },
        clientId : {
          type       : Sequelize.INTEGER,
          references : {
            model : 'users',
            key   : 'id'
          },
          allowNull : false
        },
        staffId : {
          type       : Sequelize.INTEGER,
          references : {
            model : 'users',
            key   : 'id'
          },
          allowNull : true
        },
        address : {
          type      : Sequelize.STRING,
          allowNull : false
        },
        latitude : {
          type      : Sequelize.DOUBLE,
          allowNull : false
        },
        longitude : {
          type      : Sequelize.DOUBLE,
          allowNull : false
        },
        amount : {
          type      : Sequelize.DOUBLE,
          allowNull : false,
          defaultValue : 0.0
        },
        change : {
          type      : Sequelize.DOUBLE,
          allowNull : false,
          defaultValue : 0.0
        },
        status : {
          type : Sequelize.ENUM('draft', 'placed', 'in_transit', 'fulfilled', 'rejected'),
          allowNull : false,
          defaultValue : 'draft'
        },
        statusReason : {
          type : Sequelize.STRING
        },
        createdAt : {
          type : Sequelize.DATE
        },
        updatedAt : {
          type : Sequelize.DATE
        }
      }
    )
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.dropTable('orders')
  }
};
