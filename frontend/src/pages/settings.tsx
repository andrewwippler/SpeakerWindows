import React, { FormEvent, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { setFlashMessage } from "@/features/flash/reducer";
import api from "@/library/api";
import {
  getSettings,
  getThunkSettings,
  setSettings,
} from "@/features/user/reducer";
import router from "next/router";
import {
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
  CogIcon,
  UsersIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/solid";
import { setRedirect } from "@/features/ui/reducer";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

interface TeamMember {
  userId: number;
  username: string;
  email: string;
  role: string;
}

interface Team {
  id: number;
  name: string;
  inviteCode: string;
  role?: string;
  members?: TeamMember[];
}

interface TeamMembership {
  teamId: number;
  teamName: string;
  role: string;
}

export default function Settings() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const dispatch = useAppDispatch();
  dispatch(getThunkSettings(session?.accessToken));
  const settings = useAppSelector(getSettings);

  const [team, setTeam] = useState<Team | null>(null);
  const [memberships, setMemberships] = useState<TeamMembership[]>([]);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [teamName, setTeamName] = useState("");

  useEffect(() => {
    if (session?.accessToken) {
      api.get("/team", {}, session.accessToken).then((data) => {
        if (data && !data.message) {
          setTeam(data);
          setTeamName(data.name);
        }
      });
      api.get("/team/memberships", {}, session.accessToken).then((data) => {
        if (Array.isArray(data)) {
          setMemberships(data);
        }
      });
    }
  }, [session?.accessToken]);

  const handleJoinTeam = (inviteCode: string) => {
    if (!inviteCode.trim()) return;
    api.post(`/teams/join/${inviteCode}`, {}, session?.accessToken).then((data) => {
      if (data.message) {
        dispatch(setFlashMessage({ severity: "info", message: data.message }));
        api.get("/team", {}, session?.accessToken).then((data) => {
          if (data && !data.message) {
            setTeam(data);
            setTeamName(data.name);
          }
        });
        refreshMemberships();
      } else {
        dispatch(setFlashMessage({ severity: "danger", message: data.message || "Failed to join team" }));
      }
    });
  };

  const handleUpdateTeamName = () => {
    if (!teamName.trim()) return;
    api.put("/team", { name: teamName }, session?.accessToken).then((data) => {
      if (data.message === "Team updated") {
        setTeam({ ...team!, name: teamName });
        setIsEditingName(false);
        dispatch(setFlashMessage({ severity: "info", message: "Team name updated" }));
      }
    });
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/join/${team?.inviteCode}`;
    navigator.clipboard.writeText(link);
    dispatch(setFlashMessage({ severity: "info", message: "Invite link copied!" }));
  };

  const updateMemberRole = (userId: number, role: string) => {
    api.put(`/team/members/${userId}`, { role }, session?.accessToken).then((data) => {
      if (data.message === "Member updated") {
        const updatedMembers = (team?.members || []).map((m) =>
          m.userId === userId ? { ...m, role } : m
        );
        setTeam({ ...team!, members: updatedMembers });
        dispatch(setFlashMessage({ severity: "info", message: "Member role updated" }));
      }
    });
  };

  const removeMember = (userId: number) => {
    api.delete(`/team/members/${userId}`, {}, session?.accessToken).then((data) => {
      if (data.message === "Member removed") {
        const updatedMembers = (team?.members || []).filter((m) => m.userId !== userId);
        setTeam({ ...team!, members: updatedMembers });
        dispatch(setFlashMessage({ severity: "info", message: "Member removed" }));
      }
    });
  };

  const handleLeaveTeam = (teamId: number) => {
    api.delete(`/team/memberships/${teamId}`, {}, session?.accessToken).then((data) => {
      if (data.message === "Left team successfully") {
        dispatch(setFlashMessage({ severity: "info", message: "Left team successfully" }));
        api.get("/team/memberships", {}, session?.accessToken).then((data) => {
          if (Array.isArray(data)) {
            setMemberships(data);
          }
        });
      } else {
        dispatch(setFlashMessage({ severity: "danger", message: data.message || "Failed to leave team" }));
      }
    });
  };

  const refreshMemberships = () => {
    api.get("/team/memberships", {}, session?.accessToken).then((data) => {
      if (Array.isArray(data)) {
        setMemberships(data);
      }
    });
  };

  useEffect(() => {
        if (status === "unauthenticated") {
      router.replace("/login"); // sitewide redirect
    }
    if (!session?.accessToken) dispatch(setRedirect(`/settings`));
  }, [status, dispatch]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let form = grabAndReturnObject(event.currentTarget);

    api.post(`/settings`, form, session?.accessToken).then((data) => {
      if (data.message != "Settings saved!") {
        dispatch(
          setFlashMessage({ severity: "danger", message: data.message })
        );
        return;
      }
      dispatch(setFlashMessage({ severity: "info", message: data.message }));
      dispatch(setSettings(data.settings));
    });
  };

  const grabAndReturnObject = (form: EventTarget & HTMLFormElement) => {
    return {
      place: form.place.value.trim(),
      location: form.location.value.trim(),
    };
  };
  if (!session?.accessToken) return;

  return (
    <Layout>
      {settings && (
        <>
          <div className="text-xl font-bold pb-4 text-sky-900 flex items-center">
            <CogIcon className="h-6 w-6 mr-2" />
            <span className="mr-4">Settings</span>
          </div>
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-6 justify-center">
                <label
                  htmlFor="Api-Key"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Api Key
                </label>
                <div className="mt-2">
                  {session?.accessToken ? (
                    <>
                      <span className="inline-block align-middle max-w-[150px] md:max-w-none truncate md:truncate-none">
                        {session.accessToken}
                      </span>
                      <button
                        type="button"
                        data-toggle="tooltip"
                        data-placement="bottom"
                        title="Copy API token to clipboard"
                        className=" px-2 py-2 ml-2 bg-gray-300 hover:bg-gray-500 text-white rounded-md shadow-sm"
                        onClick={() => {
                          navigator.clipboard.writeText(session?.accessToken || "");
                        }}
                      >
                        <ClipboardDocumentListIcon className="h-4 w-4" />
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Team Section */}
            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <div className="flex items-center mb-4">
                  <UsersIcon className="h-6 w-6 mr-2 text-sky-900" />
                  <h2 className="text-lg font-bold text-sky-900">Team</h2>
                </div>
                
                {/* Joined Teams Section - Show if user is member of another team */}
                {memberships.length > 0 && (
                  <div className="border rounded-md p-4 bg-blue-50 mb-4">
                    <h3 className="text-md font-semibold text-blue-900 mb-2">You are a member of:</h3>
                    {memberships.map((membership) => (
                      <div key={membership.teamId} className="flex items-center justify-between py-2 border-b border-blue-200 last:border-0">
                        <div>
                          <p className="font-medium text-gray-900">{membership.teamName}</p>
                          <p className="text-sm text-gray-500 capitalize">{membership.role}</p>
                        </div>
                        <button
                          onClick={() => handleLeaveTeam(membership.teamId)}
                          className="text-sm text-red-600 hover:text-red-500"
                        >
                          Leave Team
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Own Team Section */}
                {team ? (
                  <div className="border rounded-md p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      {isEditingName ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          />
                          <button
                            onClick={handleUpdateTeamName}
                            className="text-sm text-indigo-600 hover:text-indigo-500"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setIsEditingName(false)}
                            className="text-sm text-gray-500 hover:text-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-md font-semibold">{team.name}</h3>
                          {(team.role === 'owner' || team.role === 'creator') && (
                            <button
                              onClick={() => setIsEditingName(true)}
                              className="text-sm text-gray-500 hover:text-gray-700"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Show invite link only for owner/creator OR owner with no members in another team */}
                    {(team.role === 'owner' || team.role === 'creator') && memberships.length === 0 && (
                      <>
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-2">Invite Code: {team.inviteCode}</p>
                          <button
                            onClick={copyInviteLink}
                            className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-500"
                          >
                            Copy Invite Link
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500">
                            {team.members?.length || 0} member{(team.members?.length || 0) !== 1 ? 's' : ''}
                          </p>
                          <button
                            onClick={() => setShowMembersModal(true)}
                            className="text-sm text-indigo-600 hover:text-indigo-500"
                          >
                            Edit Members
                          </button>
                        </div>
                      </>
                    )}

                    {/* Show role badge for non-owner members */}
                    {team.role && team.role !== 'owner' && (
                      <p className="text-sm text-gray-500 capitalize">Your role: {team.role}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Loading team...</p>
                )}
              </div>
            </div>

            {/* Join Team Section - Only show if user is owner with no members and not already member of another team */}
            {team && team.role === 'owner' && memberships.length === 0 && (team.members?.length || 0) === 0 && (
              <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Join a Team</h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = e.currentTarget.elements.namedItem('inviteCode') as HTMLInputElement;
                      handleJoinTeam(input.value);
                      input.value = '';
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      name="inviteCode"
                      placeholder="Enter invite code"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                    <button
                      type="submit"
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                      Join
                    </button>
                  </form>
                </div>
              </div>
            )}

            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-6 justify-center">
                <label
                  htmlFor="Api-Key"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Uncategorized Illustrations
                </label>
                <div className="mt-2 ">
                  {settings && (settings.count ?? 0) > 0 ? (
                    <span className="text-sm text-gray-500">
                      {settings.count}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">
                      No uncategorized illustrations
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label
                  htmlFor="place"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Place
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="place"
                    id="place"
                    defaultValue={
                      settings && settings.place ? settings.place : ""
                    }
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label
                  htmlFor="location"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Location
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="location"
                    id="location"
                    defaultValue={
                      settings && settings.location ? settings.location : ""
                    }
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-x-6">
              <button
                type="button"
                className="px-4 py-2 mr-4 inline-flex items-center rounded-md font-semibold shadow-sm hover:text-white text-cyan-500 text-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500"
                onClick={() => router.back()}
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </button>
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Save Settings
              </button>
            </div>
          </form>

          {/* Team Members Modal */}
          {showMembersModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowMembersModal(false)} />

                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Team Members</h3>
                    <div className="space-y-3">
                      {team?.members?.map((member) => (
                        <div key={member.userId} className="flex items-center justify-between border-b pb-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{member.username}</p>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {member.role !== 'owner' ? (
                              <>
                                <select
                                  value={member.role}
                                  onChange={(e) => updateMemberRole(member.userId, e.target.value)}
                                  className="text-sm border rounded-md py-1 px-2"
                                >
                                  <option value="creator">Creator</option>
                                  <option value="editor">Editor</option>
                                  <option value="readonly">Read-Only</option>
                                </select>
                                <button
                                  onClick={() => removeMember(member.userId)}
                                  className="text-sm text-red-600 hover:text-red-500"
                                >
                                  Remove
                                </button>
                              </>
                            ) : (
                              <span className="text-sm text-gray-500">Owner</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                      Only owners can edit member roles or remove members.
                    </p>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                      onClick={() => setShowMembersModal(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
