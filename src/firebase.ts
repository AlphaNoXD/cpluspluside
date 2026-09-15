import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { CppFile, ProjectData } from './types';

// Initialize Firebase client
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Notice: use the provisioned database ID if provided in config
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

/**
 * Generate a friendly 6-character uppercase alphanumeric project ID (e.g., 'ABC123')
 */
export function generateProjectId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit easily confused 0, O, 1, I
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Test server connection
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'projects', '__health_check__'));
    return true;
  } catch (error) {
    // If it returns document doesn't exist, connection is alive
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is offline. Check connection.');
      return false;
    }
    return true;
  }
}

/**
 * Fetch a project from the cloud by Project ID
 */
export async function fetchProjectFromCloud(projectId: string): Promise<ProjectData | null> {
  const cleanId = projectId.trim().toUpperCase();
  if (!cleanId) return null;

  const docRef = doc(db, 'projects', cleanId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return {
    projectId: cleanId,
    files: data.files || [],
    lastUpdated: data.lastUpdated || Date.now(),
    lastUpdatedBy: data.lastUpdatedBy || '',
  };
}

/**
 * Save project to the cloud
 */
export async function saveProjectToCloud(
  projectId: string,
  files: CppFile[],
  clientId: string
): Promise<{ success: boolean; lastUpdated: number; error?: string }> {
  const cleanId = projectId.trim().toUpperCase();
  if (!cleanId) {
    return { success: false, lastUpdated: 0, error: 'Project ID cannot be empty' };
  }

  const now = Date.now();

  // Strip transient UI properties (like unsaved modification markers) before saving
  const cleanFiles = files.map((f) => ({
    id: f.id,
    name: f.name,
    content: f.content,
  }));

  try {
    const docRef = doc(db, 'projects', cleanId);
    await setDoc(docRef, {
      projectId: cleanId,
      files: cleanFiles,
      lastUpdated: now,
      lastUpdatedBy: clientId,
    }, { merge: true });

    return { success: true, lastUpdated: now };
  } catch (err) {
    console.error('Failed to save project to cloud:', err);
    return { 
      success: false, 
      lastUpdated: 0, 
      error: err instanceof Error ? err.message : 'Unknown error saving to cloud' 
    };
  }
}

/**
 * Real-time listener for remote changes on the project document
 */
export function subscribeToProject(
  projectId: string,
  onRemoteChange: (project: ProjectData) => void,
  onError?: (err: Error) => void
): () => void {
  const cleanId = projectId.trim().toUpperCase();
  const docRef = doc(db, 'projects', cleanId);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onRemoteChange({
          projectId: cleanId,
          files: data.files || [],
          lastUpdated: data.lastUpdated || Date.now(),
          lastUpdatedBy: data.lastUpdatedBy || '',
        });
      }
    },
    (err) => {
      console.warn('Firestore subscription warning:', err);
      onError?.(err);
    }
  );
}
