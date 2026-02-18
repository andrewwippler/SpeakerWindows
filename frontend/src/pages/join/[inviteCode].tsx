import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Layout from "@/components/Layout";
import api from "@/library/api";
import { setFlashMessage } from "@/features/flash/reducer";
import { useAppDispatch } from "@/hooks";
import { UsersIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";

export default function JoinTeam() {
  const router = useRouter();
  const { inviteCode } = router.query;
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();
  const [status2, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?redirect=/join/' + inviteCode);
      return;
    }

    if (status === 'authenticated' && session?.accessToken && inviteCode) {
      api.post(`/teams/join/${inviteCode}`, {}, session.accessToken)
        .then((data) => {
          if (data.message && data.message.includes('successfully')) {
            setStatus('success');
            setMessage(data.message);
          } else {
            setStatus('error');
            setMessage(data.message || 'Failed to join team');
          }
        })
        .catch((err) => {
          setStatus('error');
          setMessage(err.message || 'Failed to join team');
        });
    }
  }, [inviteCode, session, status, router]);

  if (status === 'loading' || status2 === 'loading') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500 text-lg">Joining team...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        {status2 === 'success' ? (
          <>
            <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Joined Team!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push('/settings')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500"
            >
              Go to Settings
            </button>
          </>
        ) : (
          <>
            <XCircleIcon className="h-16 w-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Cannot Join Team</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500"
            >
              Go Home
            </button>
          </>
        )}
      </div>
    </Layout>
  );
}
