'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.createTable('messages',
      {
        id : {
          type          : Sequelize.INTEGER,
          primaryKey    : true,
          autoIncrement : true
        },
        senderId : {
          type       : Sequelize.INTEGER,
          references : {
            model : 'users',
            key   : 'id'
          },
          allowNull : false
        },
        receiverId : {
          type       : Sequelize.INTEGER,
          references : {
            model : 'users',
            key   : 'id'
          },
          allowNull : false
        },
        orderId : {
          type       : Sequelize.INTEGER,
          references : {
            model : 'orders',
            key   : 'id'
          },
          allowNull : false
        },
        text : {
          type      : Sequelize.STRING,
          allowNull : false
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
    queryInterface.dropTable('messages')
  }
};
