import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface IncidentAttributes {
  id: number;
  monitorId: number;
  status: 'ongoing' | 'resolved';
  errorMessage?: string;
  responseTime?: number;
  httpCode?: number;
  startedAt: Date;
  resolvedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface IncidentCreationAttributes
  extends Optional<IncidentAttributes, 'id' | 'errorMessage' | 'responseTime' | 'httpCode' | 'resolvedAt'> {}

class Incident extends Model<IncidentAttributes, IncidentCreationAttributes> implements IncidentAttributes {
  public id!: number;
  public monitorId!: number;
  public status!: 'ongoing' | 'resolved';
  public errorMessage?: string;
  public responseTime?: number;
  public httpCode?: number;
  public startedAt!: Date;
  public resolvedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Incident.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    monitorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'monitor_id',
      references: {
        model: 'monitors',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM('ongoing', 'resolved'),
      defaultValue: 'ongoing',
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_message',
    },
    responseTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'response_time',
    },
    httpCode: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'http_code',
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'started_at',
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'resolved_at',
    },
  },
  {
    sequelize,
    tableName: 'incidents',
  }
);

export default Incident;
