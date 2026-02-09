import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface MonitorAttributes {
  id: number;
  shopId: number;
  url: string;
  checkInterval: number; // in milliseconds
  enabled: boolean;
  lastCheck?: Date;
  status: 'up' | 'down' | 'unknown';
  lastStatusCode?: number;
  lastResponseTime?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MonitorCreationAttributes
  extends Optional<
    MonitorAttributes,
    'id' | 'enabled' | 'lastCheck' | 'status' | 'lastStatusCode' | 'lastResponseTime'
  > {}

class Monitor extends Model<MonitorAttributes, MonitorCreationAttributes> implements MonitorAttributes {
  public id!: number;
  public shopId!: number;
  public url!: string;
  public checkInterval!: number;
  public enabled!: boolean;
  public lastCheck?: Date;
  public status!: 'up' | 'down' | 'unknown';
  public lastStatusCode?: number;
  public lastResponseTime?: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Monitor.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    shopId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'shop_id',
      references: {
        model: 'shops',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true,
      },
    },
    checkInterval: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 300000, // 5 minutes
      field: 'check_interval',
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastCheck: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_check',
    },
    status: {
      type: DataTypes.ENUM('up', 'down', 'unknown'),
      defaultValue: 'unknown',
    },
    lastStatusCode: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'last_status_code',
    },
    lastResponseTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'last_response_time',
    },
  },
  {
    sequelize,
    tableName: 'monitors',
  }
);

export default Monitor;
