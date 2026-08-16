/* ==========================================================================
   firebase/config.example.js
   --------------------------------------------------------------------------
   Este é um MODELO. Copie este arquivo para `firebase/config.js` (que deve
   ficar fora do Git — veja .gitignore sugerido no README) e preencha com as
   credenciais do SEU projeto Firebase.

   IMPORTANTE — leia antes de usar:
   1. Os valores abaixo (apiKey, authDomain, etc.) são identificadores
      PÚBLICOS do seu projeto Firebase. Eles não são "secretos" no sentido
      tradicional — é seguro que fiquem no frontend, DESDE QUE você configure
      corretamente as Regras de Segurança do Firestore e do Authentication.
      É a regra de segurança (Firestore Rules), não a apiKey, que protege
      seus dados.
   2. NUNCA coloque neste arquivo (ou em qualquer arquivo do frontend):
        - Service Account keys / chaves privadas (.json de admin)
        - Tokens de servidor
        - Chaves de APIs de IA (OpenAI, Anthropic, etc.) — essas SEMPRE
          devem ficar num backend/proxy, nunca no navegador do usuário.
   3. Depois de preencher, este projeto passa a poder usar Firebase
      Authentication + Cloud Firestore para sincronizar os dados entre
      computador, celular e tablet. Enquanto isso não estiver configurado,
      a plataforma continua funcionando 100% localmente (localStorage).

   Como obter esses valores:
   - Acesse https://console.firebase.google.com
   - Crie um projeto (ou use um existente)
   - Vá em "Configurações do projeto" > "Geral" > "Seus apps" > "Web"
   - Copie o objeto `firebaseConfig` gerado e cole os valores abaixo.
   ========================================================================== */

const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

/* Regras de segurança sugeridas para o Firestore (cole no console do
   Firebase, em Firestore Database > Regras) — cada usuário só acessa os
   próprios dados:

   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
*/

if (typeof window !== "undefined") window.firebaseConfig = firebaseConfig;
