import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/context/auth-context';
import { subscribeCustomerProfile } from '@/lib/customer-profile';
import {
  extractFamilyMembers,
  type FamilyMemberProfile,
} from '@/lib/family-members';
import type { CustomerProfileData } from '@/lib/recommendation-view';

export type ProfileSubjectKey = 'self' | `family:${string}`;

export type ProfileSubjectOption = {
  key: ProfileSubjectKey;
  type: 'self' | 'family';
  id: string;
  label: string;
  subtitle: string;
  relation: string | null;
  profile: CustomerProfileData | FamilyMemberProfile | null;
};

type ProfileSubjectContextValue = {
  selfProfile: CustomerProfileData | null;
  familyMembers: FamilyMemberProfile[];
  selectedSubjectKey: ProfileSubjectKey;
  selectedSubject: ProfileSubjectOption | null;
  subjectOptions: ProfileSubjectOption[];
  profilesLoading: boolean;
  profilesError: string | null;
  setSelectedSubjectKey: (key: ProfileSubjectKey) => void;
  selectSelf: () => void;
  selectFamilyMember: (id: string) => void;
};

const ProfileSubjectContext = createContext<ProfileSubjectContextValue>({
  selfProfile: null,
  familyMembers: [],
  selectedSubjectKey: 'self',
  selectedSubject: null,
  subjectOptions: [],
  profilesLoading: true,
  profilesError: null,
  setSelectedSubjectKey: () => undefined,
  selectSelf: () => undefined,
  selectFamilyMember: () => undefined,
});

const selectionStorageKey = (uid: string) => `matchmysize:selected-subject:${uid}`;

const isProfileSubjectKey = (value: string | null): value is ProfileSubjectKey =>
  value === 'self' || !!value?.startsWith('family:');

const buildSelfLabel = (
  profile: CustomerProfileData | null,
  fallback?: string | null,
  email?: string | null
) => {
  const firstName =
    typeof profile?.firstName === 'string' && profile.firstName.trim()
      ? profile.firstName.trim()
      : '';
  const lastName =
    typeof profile?.lastName === 'string' && profile.lastName.trim()
      ? profile.lastName.trim()
      : '';
  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName) return fullName;
  if (fallback?.trim()) return fallback.trim();
  if (email?.trim()) return email.trim();
  return 'My profile';
};

export function ProfileSubjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selfProfile, setSelfProfile] = useState<CustomerProfileData | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberProfile[]>([]);
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<ProfileSubjectKey>('self');
  const [selfLoading, setSelfLoading] = useState(true);
  const [profilesError, setProfilesError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setSelfProfile(null);
      setFamilyMembers([]);
      setSelectedSubjectKey('self');
      setSelfLoading(false);
      setProfilesError(null);
      return;
    }

    const savedSelection =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(selectionStorageKey(user.uid))
        : null;

    setSelectedSubjectKey(isProfileSubjectKey(savedSelection) ? savedSelection : 'self');
    setSelfLoading(true);
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    setSelfLoading(true);
    setProfilesError(null);

    const unsubscribe = subscribeCustomerProfile(
      user.uid,
      (data) => {
        const nextProfile = (data as CustomerProfileData) ?? null;
        setSelfProfile(nextProfile);
        setFamilyMembers(extractFamilyMembers(nextProfile?.familyMembers));
        setSelfLoading(false);
      },
      (error) => {
        setProfilesError(error.message);
        setFamilyMembers([]);
        setSelfLoading(false);
      }
    );

    return () => unsubscribe?.();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || typeof window === 'undefined') return;
    window.localStorage.setItem(selectionStorageKey(user.uid), selectedSubjectKey);
  }, [selectedSubjectKey, user?.uid]);

  const subjectOptions = useMemo<ProfileSubjectOption[]>(() => {
    const selfLabel = buildSelfLabel(
      selfProfile,
      user?.displayName,
      user?.email
    );

    const options: ProfileSubjectOption[] = [];

    if (user?.uid) {
      options.push({
        key: 'self',
        type: 'self',
        id: user.uid,
        label: selfLabel,
        subtitle: 'My profile',
        relation: null,
        profile: selfProfile,
      });
    }

    familyMembers.forEach((member) => {
      options.push({
        key: `family:${member.id}`,
        type: 'family',
        id: member.id,
        label: member.firstName,
        subtitle: member.relation,
        relation: member.relation,
        profile: member,
      });
    });

    return options;
  }, [familyMembers, selfProfile, user?.displayName, user?.email, user?.uid]);

  const selectedSubject =
    subjectOptions.find((option) => option.key === selectedSubjectKey) ??
    subjectOptions[0] ??
    null;

  const value = useMemo<ProfileSubjectContextValue>(
    () => ({
      selfProfile,
      familyMembers,
      selectedSubjectKey,
      selectedSubject,
      subjectOptions,
      profilesLoading: selfLoading,
      profilesError,
      setSelectedSubjectKey,
      selectSelf: () => setSelectedSubjectKey('self'),
      selectFamilyMember: (id: string) => setSelectedSubjectKey(`family:${id}`),
    }),
    [
      familyMembers,
      profilesError,
      selectedSubject,
      selectedSubjectKey,
      selfLoading,
      selfProfile,
      subjectOptions,
    ]
  );

  return (
    <ProfileSubjectContext.Provider value={value}>
      {children}
    </ProfileSubjectContext.Provider>
  );
}

export const useProfileSubject = () => useContext(ProfileSubjectContext);
