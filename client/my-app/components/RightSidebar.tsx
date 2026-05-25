"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { Input } from "./ui/input";
import { Button } from "./ui/button";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  useGetSuggestedUsersQuery,
  useFollowOrUnFollowMutation,
  useGetProfileQuery,
} from "@/redux/authApi";

import { toast } from "sonner";

const RightSidebar = () => {
  const router = useRouter();

  const { data: currentUserData } = useGetProfileQuery();
  const currentUser = currentUserData?.user;

  const [query, setQuery] = useState("");

  const { data, isLoading, refetch } = useGetSuggestedUsersQuery();

  const [followOrUnFollow] = useFollowOrUnFollowMutation();

  const users = data?.users || [];

  // SEARCH
  const handleSearch = () => {
    if (!query.trim()) return;

    router.push(`/social/search?i=${encodeURIComponent(query)}`);
  };

  // FOLLOW
  const handleFollow = async (id: string) => {
    try {
      const res = await followOrUnFollow({ id }).unwrap();

      toast.success(res.followed ? "Followed ❤️" : "Unfollowed 💔");

      refetch?.();
    } catch (err: any) {
      toast.error(err?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="space-y-6 pt-6">

      {/* SEARCH */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10 rounded-full py-5"
            placeholder="Search..."
          />
        </div>

        <Button onClick={handleSearch} className="rounded-full">
          Search
        </Button>
      </div>

      {/* WHO TO FOLLOW */}
      <div className="border rounded-2xl p-4 space-y-4 bg-white">
        <h3 className="text-lg font-semibold">Who to follow</h3>

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          users.map((user: any) => {
            const isFollowing =
              currentUser?.following?.includes(user._id) ?? false;

            return (
              <div
                key={user._id}
                className="flex items-center justify-between"
              >
                {/* LEFT */}
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.profilePic} />
                    <AvatarFallback>
                      {user.name?.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <p className="text-sm font-semibold">
                      {user.name}
                    </p>

                    <p className="text-xs text-gray-500">
                      @{user.email?.split("@")[0]}
                    </p>
                  </div>
                </div>

                {/* BUTTON */}
                <Button
                  size="sm"
                  onClick={() => handleFollow(user._id)}
                  className={`rounded-full px-4 transition-all ${
                    isFollowing
                      ? "bg-gray-200 text-black hover:bg-gray-300"
                      : "bg-black text-white hover:bg-gray-800"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RightSidebar;