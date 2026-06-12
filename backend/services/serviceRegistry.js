import sublyticsService from './sublyticsService.js';

const registry = {
  sublytics: sublyticsService,
  // Dynamic register point for future adapters:
  // newGateway: newGatewayService
};

export const getService = (serviceName) => {
  const service = registry[serviceName || 'sublytics'];
  if (!service) {
    throw new Error(`Order Service '${serviceName}' is not registered in the service registry.`);
  }
  return service;
};

export const registerService = (serviceName, serviceInstance) => {
  registry[serviceName] = serviceInstance;
};
