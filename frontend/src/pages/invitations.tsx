import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import api from "@/library/api";
import { useAppDispatch } from "@/hooks";
import { setFlashMessage } from "@/features/flash/reducer";
import { ArrowLeftIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";

interface Invitation {
  id: number;
  teamId: number;
  teamName: string;
  role: string;
}

export default function Invitations() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
    if (session?.accessToken) {
      api.get("/user/invitations", {}, session.accessToken).then((data) => {
        if (Array.isArray(data)) {
          setInvitations(data);
        }
        setLoading(false);
      });
    }
  }, [session?.accessToken, status, router]);

  const handleAccept = (invitationId: number) => {
    api.post(`/team/invitations/${invitationId}/accept`, {}, session?.accessToken).then((data) => {
      if (data.message === "Joined team successfully") {
        dispatch(setFlashMessage({ severity: "info", message: "You joined the team!" }));
        setInvitations(invitations.filter((i) => i.id !== invitationId));
      } else {
        dispatch(setFlashMessage({ severity: "danger", message: data.message || "Failed to accept invitation" }));
      }
    });
  };

  const handleDecline = (invitationId: number) => {
    api.post(`/team/invitations/${invitationId}/decline`, {}, session?.accessToken).then((data) => {
      if (data.message === "Invitation declined") {
        dispatch(setFlashMessage({ severity: "info", message: "Invitation declined" }));
        setInvitations(invitations.filter((i) => i.id !== invitationId));
      } else {
        dispatch(setFlashMessage({ severity: "danger", message: data.message || "Failed to decline invitation" }));
      }
    });
  };

  if (!session?.accessToken || loading) {
    return <Layout>Loading...</Layout>;
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-sky-900">Team Invitations</h1>
        </div>

        {invitations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">You have no pending invitations.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="border rounded-lg p-4 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{invitation.teamName}</h3>
                    <p className="text-sm text-gray-500 capitalize">Role: {invitation.role}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(invitation.id)}
                      className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-500 text-sm"
                    >
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(invitation.id)}
                      className="flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                    >
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
