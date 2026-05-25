"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { useSearchPostQuery } from "@/redux/postApi";
import {
  useFollowOrUnFollowMutation,
  useGetProfileQuery,
} from "@/redux/authApi";

import { toast } from "sonner";

import Comment from "@/components/Comment";
import { IAuthor, IPost } from "@/type/type";
import PostCard from "@/components/PostCard";
import Link from "next/link";

export default function SearchClient() {
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("i") || "";

  const [query, setQuery] = useState("");

  const [open, setOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<IPost | null>(null);

  const { data: currentUserData } = useGetProfileQuery();
  const currentUser = currentUserData?.user;

  const { data, isLoading, isError, refetch } =
    useSearchPostQuery(query, {
      skip: query.trim() === "",
    });

  const [followOrUnFollow] = useFollowOrUnFollowMutation();

  // sync URL → state
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleFollow = async (id: string) => {
    try {
      const res = await followOrUnFollow({ id }).unwrap();

      toast.success(res.followed ? "Followed ❤️" : "Unfollowed 💔");

      refetch?.();
    } catch (err: any) {
      toast.error(err?.data?.message || "Something went wrong");
    }
  };

  const isFollowing = (id: string) => {
    return currentUser?.following?.includes(id) ?? false;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* SEARCH INPUT */}
      <div className="flex items-center gap-2 border rounded-2xl px-3 py-2 bg-white shadow-sm">
        <Search className="text-gray-400" size={18} />

        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="border-0 focus-visible:ring-0 shadow-none"
        />
      </div>

      {/* LOADING */}
      {isLoading && (
        <p className="mt-4 text-center text-sm text-gray-500">
          Searching...
        </p>
      )}

      {/* ERROR */}
      {isError && (
        <p className="mt-4 text-center text-red-500">
          Something went wrong
        </p>
      )}

      {/* TABS */}
      <Tabs defaultValue="posts" className="mt-6">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        {/* POSTS */}
        <TabsContent value="posts" className="mt-6 space-y-6">
          {query && data?.post?.length ? (
            data.post.map((post: IPost) => (
              <PostCard key={post._id} post={post} refetch={refetch} />
            ))
          ) : (
            <p className="text-center text-gray-500">
              No posts found
            </p>
          )}
        </TabsContent>

        {/* USERS */}
        <TabsContent value="users" className="mt-6 space-y-3">
          {query && data?.user?.length ? (
            data.user.map((item: IAuthor) => (
              <div
                key={item._id}
                className="flex items-center justify-between border rounded-2xl p-3"
              >
                <div className="flex items-center gap-3">
                  <Link href={`/social/profile/${item._id}`}>
                    <Avatar>
                      <AvatarImage src={item.profilePic} />
                      <AvatarFallback>
                        {item.name?.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>

                  <div>
                    <h2 className="font-semibold">{item.name}</h2>
                    <p className="text-sm text-gray-500">
                      @{item.name}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => handleFollow(item._id)}
                  className={`rounded-full ${
                    isFollowing(item._id)
                      ? "bg-gray-200 text-black"
                      : "bg-black text-white"
                  }`}
                >
                  {isFollowing(item._id) ? "Following" : "Follow"}
                </Button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">
              No users found
            </p>
          )}
        </TabsContent>
      </Tabs>

      <Comment open={open} setOpen={setOpen} post={selectedPost} />
    </div>
  );
}