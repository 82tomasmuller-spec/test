import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AlertAttributes {
  id: number;
  incidentId: number;
  type: 'email' | 'sms' | 'webhook' | 'telegram';
  recipient: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: Date;
  errorMessage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AlertCreationAttributes
  extends Optional<AlertAttributes, 'id' | 'status' | 'sentAt' | 'errorMessage'> {}

class Alert extends Model<AlertAttributes, AlertCreationAttributes> implements AlertAttributes {
  public id!: number;
  public incidentId!: number;
  public type!: 'email' | 'sms' | 'webhook' | 'telegram';
  public recipient!: string;
  public status!: 'pending' | 'sent' | 'failed';
  public sentAt?: Date;
  public errorMessage?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Alert.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    incidentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'incident_id',
      references: {
        model: 'incidents',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    type: {
      type: DataTypes.ENUM('email', 'sms', 'webhook', 'telegram'),
      allowNull: false,
    },
    recipient: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'failed'),
      defaultValue: 'pending',
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'sent_at',
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_message',
    },
  },
  {
    sequelize,
    tableName: 'alerts',
  }
);

export default Alert;
