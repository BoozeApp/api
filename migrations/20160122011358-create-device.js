'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.createTable('devices',
      {
        id : {
          type          : Sequelize.INTEGER,
          primaryKey    : true,
          autoIncrement : true
        },
        userId : {
          type       : Sequelize.INTEGER,
          references : {
            model : 'users',
            key   : 'id'
          },
          allowNull : false
        },
        token : {
          type : Sequelize.STRING
        },
        type : {
          type : Sequelize.ENUM('ios', 'android'),
          allowNull : false,
          defaultValue : 'android'
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
    queryInterface.dropTable('devices')
  }
};
