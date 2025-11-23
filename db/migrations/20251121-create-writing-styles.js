// migrations/20251120-create-writing-styles.js
const { deletedAtCreate } = require('../migrationLib/createHelper.cjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 공통 테이블 옵션
    const tableOpts = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' };

    // writing_styles 테이블 생성
    await queryInterface.createTable('writing_styles', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      styleAnalysis: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'AI 문체 분석 결과 (JSON)',
      },
      sampleText: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '분석에 사용된 샘플 텍스트 (일부)',
      },
      originalFilename: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: '업로드된 원본 파일명',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }, tableOpts);

    // userId에 unique 제약 조건 추가 (사용자당 하나의 문체만 저장)
    await queryInterface.addConstraint('writing_styles', {
      fields: ['userId'],
      type: 'unique',
      name: 'unique_user_style',
    });

    // userId 인덱스 추가
    await queryInterface.addIndex('writing_styles', ['userId'], {
      name: 'ix_writing_styles_userId',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('writing_styles');
  },
};





