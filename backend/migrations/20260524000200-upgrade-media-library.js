module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Media', 'variants', {
      type: Sequelize.JSONB,
      defaultValue: {},
    });
    await queryInterface.addColumn('Media', 'collection', {
      type: Sequelize.STRING(120),
      allowNull: true,
    });
    await queryInterface.addColumn('Media', 'focalPointX', {
      type: Sequelize.FLOAT,
      defaultValue: 0.5,
    });
    await queryInterface.addColumn('Media', 'focalPointY', {
      type: Sequelize.FLOAT,
      defaultValue: 0.5,
    });
    await queryInterface.addColumn('Media', 'needsAltText', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    await queryInterface.addIndex('Media', ['type']);
    await queryInterface.addIndex('Media', ['folder']);
    await queryInterface.addIndex('Media', ['collection']);
    await queryInterface.addIndex('Media', ['usageCount']);
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('Media', ['usageCount']);
    await queryInterface.removeIndex('Media', ['collection']);
    await queryInterface.removeIndex('Media', ['folder']);
    await queryInterface.removeIndex('Media', ['type']);
    await queryInterface.removeColumn('Media', 'needsAltText');
    await queryInterface.removeColumn('Media', 'focalPointY');
    await queryInterface.removeColumn('Media', 'focalPointX');
    await queryInterface.removeColumn('Media', 'collection');
    await queryInterface.removeColumn('Media', 'variants');
  },
};
