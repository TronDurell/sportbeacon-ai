export const initializeApp = () => ({});
export const applicationDefault = () => ({});
export const getApps = () => [1];
export const firestore = { 
  getFirestore: () => ({ 
    collection: () => ({ 
      doc: () => ({ 
        get: async () => ({ 
          exists: true, 
          data: () => ({}) 
        }) 
      }) 
    }) 
  }) 
};
