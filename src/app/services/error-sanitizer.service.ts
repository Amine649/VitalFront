import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ErrorSanitizerService {

  /**
   * Sanitize error and return user-friendly message
   * Never expose internal server details, SQL errors, or stack traces
   */
  sanitizeError(error: any): string {
    // Handle HttpErrorResponse
    if (error instanceof HttpErrorResponse) {
      return this.sanitizeHttpError(error);
    }

    // Handle Error objects
    if (error instanceof Error) {
      // Never expose error.message directly - it may contain sensitive info
      return 'Une erreur est survenue. Veuillez réessayer.';
    }

    // Handle string errors
    if (typeof error === 'string') {
      // Don't return the string directly - it may contain sensitive info
      return 'Une erreur est survenue. Veuillez réessayer.';
    }

    // Default fallback
    return 'Une erreur est survenue. Veuillez réessayer.';
  }

  /**
   * Sanitize HTTP errors based on status code
   */
  private sanitizeHttpError(error: HttpErrorResponse): string {
    switch (error.status) {
      case 0:
        return 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
      
      case 400:
        return 'Requête invalide. Veuillez vérifier les informations saisies.';
      
      case 401:
        return 'Session expirée. Veuillez vous reconnecter.';
      
      case 403:
        return 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
      
      case 404:
        return 'Ressource introuvable.';
      
      case 408:
        return 'Délai d\'attente dépassé. Veuillez réessayer.';
      
      case 409:
        return 'Conflit détecté. Cette opération ne peut pas être effectuée.';
      
      case 429:
        return 'Trop de requêtes. Veuillez patienter quelques instants.';
      
      case 500:
        return 'Erreur serveur. Veuillez réessayer plus tard.';
      
      case 502:
        return 'Service temporairement indisponible. Veuillez réessayer.';
      
      case 503:
        return 'Service en maintenance. Veuillez réessayer plus tard.';
      
      case 504:
        return 'Délai d\'attente du serveur dépassé. Veuillez réessayer.';
      
      default:
        if (error.status >= 500) {
          return 'Erreur serveur. Veuillez réessayer plus tard.';
        }
        if (error.status >= 400) {
          return 'Une erreur est survenue. Veuillez vérifier votre saisie.';
        }
        return 'Une erreur est survenue. Veuillez réessayer.';
    }
  }

  /**
   * Sanitize error for specific operations
   */
  sanitizeOperationError(error: any, operation: string): string {
    const baseMessage = this.sanitizeError(error);
    
    // Add context without exposing details
    const operationMessages: { [key: string]: string } = {
      'login': 'Échec de la connexion. Vérifiez vos identifiants.',
      'register': 'Échec de l\'inscription. Veuillez réessayer.',
      'inscription': 'Échec de l\'inscription. Veuillez réessayer.',
      'update': 'Échec de la mise à jour. Veuillez réessayer.',
      'delete': 'Échec de la suppression. Veuillez réessayer.',
      'create': 'Échec de la création. Veuillez réessayer.',
      'load': 'Échec du chargement. Veuillez réessayer.',
      'save': 'Échec de la sauvegarde. Veuillez réessayer.',
      'upload': 'Échec de l\'envoi. Veuillez réessayer.',
      'download': 'Échec du téléchargement. Veuillez réessayer.',
      'payment': 'Échec du paiement. Veuillez réessayer.',
      'checkout': 'Échec de la commande. Veuillez réessayer.',
      'commande': 'Échec de la commande. Veuillez réessayer.',
      'validation': 'Échec de la validation. Veuillez réessayer.',
      'souscription': 'Échec de la souscription. Veuillez réessayer.',
      'changement de mot de passe': 'Échec du changement de mot de passe. Veuillez réessayer.',
      'envoi du code OTP': 'Erreur lors de l\'envoi du code. Veuillez réessayer.',
      'réinitialisation du mot de passe': 'Erreur lors de la réinitialisation du mot de passe. Veuillez réessayer.',
      'chargement des produits': 'Échec du chargement des produits. Veuillez réessayer.',
      'chargement des abonnements': 'Échec du chargement des abonnements. Veuillez réessayer.',
      'chargement des utilisateurs': 'Échec du chargement des utilisateurs. Veuillez réessayer.',
      'chargement des vétérinaires': 'Échec du chargement des vétérinaires. Veuillez réessayer.',
      'chargement des boutiques': 'Échec du chargement des boutiques. Veuillez réessayer.',
      'chargement des cabinets': 'Échec du chargement des cabinets. Veuillez réessayer.',
      'chargement des blogs': 'Échec du chargement des blogs. Veuillez réessayer.',
      'chargement du tableau de bord': 'Échec du chargement du tableau de bord. Veuillez réessayer.',
      'ajout du cabinet': 'Échec de l\'ajout du cabinet. Veuillez réessayer.',
      'modification du cabinet': 'Échec de la modification du cabinet. Veuillez réessayer.',
      'suppression du cabinet': 'Échec de la suppression du cabinet. Veuillez réessayer.',
      'ajout de la boutique': 'Échec de l\'ajout de la boutique. Veuillez réessayer.',
      'modification de la boutique': 'Échec de la modification de la boutique. Veuillez réessayer.',
      'suppression de la boutique': 'Échec de la suppression de la boutique. Veuillez réessayer.',
      'ajout du blog': 'Échec de l\'ajout du blog. Veuillez réessayer.',
      'modification du blog': 'Échec de la modification du blog. Veuillez réessayer.',
      'suppression du blog': 'Échec de la suppression du blog. Veuillez réessayer.',
      'mise à jour du vétérinaire': 'Échec de la mise à jour du vétérinaire. Veuillez réessayer.',
      'suppression du vétérinaire': 'Échec de la suppression du vétérinaire. Veuillez réessayer.',
      'importation du fichier Excel': 'Échec de l\'importation du fichier Excel. Veuillez réessayer.',
      'importation du fichier': 'Échec de l\'importation du fichier. Veuillez réessayer.',
      'assignation de l\'abonnement': 'Échec de l\'assignation de l\'abonnement. Veuillez réessayer.',
      'mise à jour de l\'abonnement': 'Échec de la mise à jour de l\'abonnement. Veuillez réessayer.',
      'suppression de l\'abonnement': 'Échec de la suppression de l\'abonnement. Veuillez réessayer.'
    };

    // For 401/403 errors, use the base message (session/permission)
    if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
      return baseMessage;
    }

    // For 404 errors on specific operations, provide more context
    if (error instanceof HttpErrorResponse && error.status === 404) {
      if (operation.includes('chargement')) {
        return 'Aucune donnée trouvée.';
      }
    }

    return operationMessages[operation] || baseMessage;
  }

  /**
   * Check if error should trigger logout (session expired)
   */
  shouldLogout(error: any): boolean {
    if (error instanceof HttpErrorResponse) {
      return error.status === 401;
    }
    return false;
  }
}
