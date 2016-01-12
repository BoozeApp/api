'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.createTable('orderBeverages',
      {
        id : {
          type          : Sequelize.INTEGER,
          primaryKey    : true,
          autoIncrement : true
        },
        orderId : {
          type       : Sequelize.INTEGER,
          references : {
            model : 'orders',
            key   : 'id'
          },
          allowNull : false
        },
        beverageId : {
          type       : Sequelize.INTEGER,
          references : {
            model : 'beverages',
            key   : 'id'
          },
          allowNull : false
        },
        amount : {
          type : Sequelize.INTEGER,
          defaultValue : 1
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
    queryInterface.dropTable('orderBeverages')
  }
};
