'use strict'

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.createTable('beverages',
      {
        id : {
          type          : Sequelize.INTEGER,
          primaryKey    : true,
          autoIncrement : true
        },
        name : {
          type       : Sequelize.STRING,
          allowNull  : false
        },
        picture : {
          type      : Sequelize.STRING,
          allowNull : true
        },
        price : {
          type      : Sequelize.DOUBLE,
          allowNull : false,
          defaultValue : 0.0
        },
        max : {
          type      : Sequelize.INTEGER,
          allowNull : false,
          defaultValue : 0.0
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
    queryInterface.dropTable('beverages')
  }
}
