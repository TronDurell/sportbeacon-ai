import { FirebaseApp } from "firebase/app";
import { Auth } from "firebase/auth";
import { Firestore } from "firebase/firestore";
export type TestEnv = {
    app: FirebaseApp;
    db: Firestore;
    auth: Auth;
};
export declare function initTestApp(projectId?: string): TestEnv;
//# sourceMappingURL=firebase.d.ts.map