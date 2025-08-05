# WhatsApp NestJS API

API WhatsApp avec NestJS et whatsapp-web.js

## Installation

```bash
npm install
```

## Démarrage

```bash
# Mode développement
npm run start:dev

# Mode production
npm run build
npm run start:prod
```

## Endpoints

### 📱 Connexion WhatsApp
- `GET /whatsapp/qr` - Obtenir le QR code
- `GET /whatsapp/status` - Statut de la connexion

### 📨 Envoi de messages
- `POST /whatsapp/send` - Envoyer un message

```json
{
  "from": "33123456789",
  "to": "33987654321", 
  "message": "Votre code de validation est: 123456"
}
```

### 📊 Logs et statistiques
- `GET /whatsapp/logs` - Tous les logs
- `GET /whatsapp/logs/:numero` - Logs d'un numéro spécifique

### ✅ Santé
- `GET /whatsapp/health` - Status de l'API

## Utilisation

1. Démarrer l'API: `npm run start:dev`
2. Scanner le QR code affiché dans la console
3. Envoyer des messages via POST /whatsapp/send

## Port

L'API fonctionne sur le port **4500**

## Documentation Swagger

Une fois l'API démarrée, la documentation Swagger est disponible à :

**👉 http://localhost:4500/api-docs**

Vous pouvez tester tous les endpoints directement depuis l'interface Swagger !

## 🐳 Déploiement Docker (Recommandé)

### Installation rapide avec Docker

```bash
# Cloner le projet
git clone <votre-repo>
cd whatsapp-nestjs

# Démarrer avec Docker Compose
docker-compose up -d

# Ou utiliser le script de déploiement
./deploy.sh
```

### Commandes Docker utiles

```bash
# Construire et démarrer
docker-compose up -d --build

# Voir les logs
docker-compose logs -f

# Redémarrer
docker-compose restart

# Arrêter
docker-compose down

# Nettoyer tout
docker-compose down -v
```

## 🚀 CI/CD automatique

Le projet inclut une configuration GitHub Actions qui :
- ✅ Teste le code à chaque push
- 🐳 Construit l'image Docker
- 🚀 Déploie automatiquement sur votre serveur

### Configuration requise

Ajoutez ces secrets dans GitHub:
- `DOCKER_USERNAME` - Nom d'utilisateur Docker Hub
- `DOCKER_TOKEN` - Token Docker Hub
- `SERVER_HOST` - IP de votre serveur
- `SERVER_USER` - Utilisateur SSH
- `SERVER_SSH_KEY` - Clé privée SSH

## 📱 Connexion WhatsApp

1. Démarrez l'API
2. Scannez le QR code affiché dans les logs : `docker-compose logs -f`
3. Ou récupérez-le via : `curl http://localhost:4500/whatsapp/qr`