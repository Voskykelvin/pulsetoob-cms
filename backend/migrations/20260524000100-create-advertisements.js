module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Advertisements', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      title: { type: Sequelize.STRING(160), allowNull: false },
      imageUrl: { type: Sequelize.STRING(1000), allowNull: false },
      targetUrl: { type: Sequelize.STRING(1000), allowNull: false },
      slot: {
        type: Sequelize.ENUM('header_leaderboard', 'sidebar_square', 'in_article_banner'),
        allowNull: false,
      },
      sponsorName: { type: Sequelize.STRING(160), allowNull: true },
      impressions: { type: Sequelize.INTEGER, defaultValue: 0 },
      clicks: { type: Sequelize.INTEGER, defaultValue: 0 },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      startDate: { type: Sequelize.DATE, allowNull: true },
      endDate: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('Advertisements', ['slot', 'isActive']);
    await queryInterface.addIndex('Advertisements', ['startDate']);
    await queryInterface.addIndex('Advertisements', ['endDate']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('Advertisements');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Advertisements_slot";');
  },
};
