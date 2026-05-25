"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Upload } from "lucide-react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useForm } from "react-hook-form";

import {
  useCreatePostMutation,
  useEditPostMutation,
} from "@/redux/postApi";

import { toast } from "sonner";

type PostFormData = {
  title: string;
  file: FileList;
};

type Props = {
  open: boolean;
  setOpen: (value: boolean) => void;
  post?: any;
  refetch?: () => void;
};

const Post = ({
  open,
  setOpen,
  post,
  refetch,
}: Props) => {
  const [createPost, { isLoading }] =
    useCreatePostMutation();

  const [editPost] = useEditPostMutation();

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PostFormData>();

  // ================= FILL DATA FOR EDIT =================
  useEffect(() => {
    if (post) {
      setValue("title", post.title || "");
      setPreview(post.post || null);
    } else {
      reset();
      setPreview(null);
    }
  }, [post,setValue]);

  // ================= SUBMIT =================
  const onSubmit = async (data: PostFormData) => {
    const file = data.file?.[0];

    const formData = new FormData();
    formData.append("title", data.title);

    if (file) {
      formData.append("post", file);
    }

    try {
      // ================= EDIT =================
      if (post) {
        const res=await editPost({
          id: post._id,
          formData,
        }).unwrap();
        console.log(res)
        toast.success("Post updated ✏️");
      }

      // ================= CREATE =================
      else {
        await createPost(formData).unwrap();

        toast.success("Post created 🎉");
      }

      reset();
      setPreview(null);
      setOpen(false);
      refetch?.();
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  const fileRegister = register("file");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            {post ? "Edit Post" : "Create Post"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          {/* IMAGE UPLOAD */}
          <div className="flex flex-col items-center gap-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="h-28 w-28 flex items-center justify-center rounded-full border-2 border-dashed border-blue-500 cursor-pointer overflow-hidden bg-blue-50"
            >
              {preview ? (
                <img
                  src={preview}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Upload size={32} />
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              {...fileRegister}
              ref={(e) => {
                fileRegister.ref(e);
                fileRef.current = e;
              }}
              onChange={(e) => {
                fileRegister.onChange(e);

                const file = e.target.files?.[0];

                if (file) {
                  setPreview(URL.createObjectURL(file));
                }
              }}
            />
          </div>

          {/* TITLE */}
          <div>
            <Label>Title</Label>
            <Input
              placeholder="Enter post title..."
              {...register("title", {
                required: "Title is required",
              })}
            />
            {errors.title && (
              <p className="text-red-500 text-xs">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* BUTTONS */}
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="bg-blue-600"
            >
              {isLoading
                ? "Loading..."
                : post
                ? "Update"
                : "Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default Post;