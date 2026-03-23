/**
 * Utility functions for handling service interaction types
 * Based on category-level interactionType field
 */

export type InteractionType = 'CONTACT_ONLY' | 'PURCHASE_ONLY' | 'HYBRID';

export interface ServiceWithInteraction {
  category?: {
    _id?: string;
    name?: string;
    slug?: string;
    interactionType?: InteractionType;
  } | string;
  interactionType?: InteractionType; // Direct field if available
}

/**
 * Get the interaction type for a service
 * Services inherit interactionType from their category
 */
export function getServiceInteractionType(service: ServiceWithInteraction): InteractionType {
  // If service has direct interactionType, use it
  if (service.interactionType) {
    return service.interactionType;
  }

  // Otherwise, get from category
  if (typeof service.category === 'object' && service.category?.interactionType) {
    return service.category.interactionType;
  }

  // Default to PURCHASE_ONLY if not specified
  return 'PURCHASE_ONLY';
}

/**
 * Check if service allows direct booking
 */
export function canBookDirectly(service: ServiceWithInteraction): boolean {
  const interactionType = getServiceInteractionType(service);
  return interactionType === 'PURCHASE_ONLY' || interactionType === 'HYBRID';
}

/**
 * Check if service requires contact only
 */
export function requiresContactOnly(service: ServiceWithInteraction): boolean {
  return getServiceInteractionType(service) === 'CONTACT_ONLY';
}

/**
 * Check if service is hybrid (allows both contact and booking)
 */
export function isHybrid(service: ServiceWithInteraction): boolean {
  return getServiceInteractionType(service) === 'HYBRID';
}

/**
 * Get the primary CTA text based on interaction type
 */
export function getPrimaryCTAText(service: ServiceWithInteraction): string {
  const interactionType = getServiceInteractionType(service);
  
  switch (interactionType) {
    case 'CONTACT_ONLY':
      return 'Request Quote';
    case 'PURCHASE_ONLY':
      return 'Book Now';
    case 'HYBRID':
      return 'Get Quote';
    default:
      return 'Book Now';
  }
}

/**
 * Get the secondary CTA text for hybrid services
 */
export function getSecondaryCTAText(service: ServiceWithInteraction): string | null {
  if (isHybrid(service)) {
    return 'Book Now';
  }
  return null;
}

/**
 * Get helper text to display under CTA
 */
export function getHelperText(service: ServiceWithInteraction): string | null {
  const interactionType = getServiceInteractionType(service);
  
  switch (interactionType) {
    case 'CONTACT_ONLY':
      return 'Site visit and quotation required before final pricing';
    case 'PURCHASE_ONLY':
      return null; // No helper text needed for direct purchase
    case 'HYBRID':
      return 'You may request a quote or proceed with booking if pricing is available';
    default:
      return null;
  }
}

/**
 * Check if pricing should be shown for a service
 */
export function shouldShowPricing(service: ServiceWithInteraction): boolean {
  const interactionType = getServiceInteractionType(service);
  return interactionType !== 'CONTACT_ONLY';
}
