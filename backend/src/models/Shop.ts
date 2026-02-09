import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ShopAttributes {
  id: number;
  userId: number;
  name: string;
  domain: string;
  description?: string;
  enabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ShopCreationAttributes extends Optional<ShopAttributes, 'id' | 'description' | 'enabled'> {}

class Shop extends Model<ShopAttributes, ShopCreationAttributes> implements ShopAttributes {
  public id!: number;
  public userId!: number;
  public name!: string;
  public domain!: string;
  public description?: string;
  public enabled!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Shop.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'shops',
  }
);

export default Shop;
