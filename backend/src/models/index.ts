import User from './User';
import Shop from './Shop';
import Monitor from './Monitor';
import Incident from './Incident';
import Alert from './Alert';

// Define associations
User.hasMany(Shop, { foreignKey: 'userId', as: 'shops' });
Shop.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Shop.hasMany(Monitor, { foreignKey: 'shopId', as: 'monitors' });
Monitor.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });

Monitor.hasMany(Incident, { foreignKey: 'monitorId', as: 'incidents' });
Incident.belongsTo(Monitor, { foreignKey: 'monitorId', as: 'monitor' });

Incident.hasMany(Alert, { foreignKey: 'incidentId', as: 'alerts' });
Alert.belongsTo(Incident, { foreignKey: 'incidentId', as: 'incident' });

export { User, Shop, Monitor, Incident, Alert };
