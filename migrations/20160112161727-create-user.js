'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.createTable('users',
      {
        id : {
          type          : Sequelize.INTEGER,
          primaryKey    : true,
          autoIncrement : true
        },
        name : {
          type      : Sequelize.STRING,
          allowNull : false
        },
        email : {
          type      : Sequelize.STRING,
          allowNull : false,
          unique    : true
        },
        facebookId : {
          type : Sequelize.STRING
        },
        picture : {
          type : Sequelize.STRING
        },
        level : {
          type : Sequelize.ENUM('client', 'staff', 'admin'),
          allowNull : false,
          defaultValue : 'client'
        },
        telephone : {
          type : Sequelize.STRING
        },
        latitude : {
          type : Sequelize.DOUBLE
        },
        longitude : {
          type : Sequelize.DOUBLE
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
    queryInterface.dropTable('users')
  }
};
