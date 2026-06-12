import sublyticsService from './sublyticsService.js';

const registry = {
  sublytics: sublyticsService,
  // Dynamic register point for future adapters:
  // newGateway: newGatewayService
};

export const getService = (serviceName) => {
  const resolvedName = serviceName || 'sublytics';
  console.log(`[DEBUG][REGISTRY] Looking up service: "${resolvedName}"`);
  const service = registry[resolvedName];
  if (!service) {
    console.error(`[DEBUG][REGISTRY] Service NOT FOUND: "${resolvedName}". Available: [${Object.keys(registry).join(', ')}]`);
    throw new Error(`Order Service '${resolvedName}' is not registered in the service registry.`);
  }
  console.log(`[DEBUG][REGISTRY] Service "${resolvedName}" resolved successfully`);
  return service;
};

export const registerService = (serviceName, serviceInstance) => {
  console.log(`[DEBUG][REGISTRY] Registering new service: "${serviceName}"`);
  registry[serviceName] = serviceInstance;
};
