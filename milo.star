# Copyright 2020 the V8 project authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

load("//lib/lib.star", "branch_descriptors", "console_view")

def branch_consoles():
    for branch in branch_descriptors:
        branch.create_consoles()

def list_view(name, title):
    luci.list_view(
        name = name,
        title = title,
        favicon = "https://storage.googleapis.com/chrome-infra-public/logo/v8.ico",
    )

luci.milo(
    logo = "https://storage.googleapis.com/chrome-infra-public/logo/v8.svg",
)

branch_consoles()

console_view("experiments")
console_view("integration")
console_view("clusterfuzz")
console_view("chromium", repo = "https://chromium.googlesource.com/chromium/src")

console_view(
    name = "official",
    repo = "https://chromium.googlesource.com/v8/v8",
    refs = ["refs/branch-heads/\\d+\\.\\d+", "refs/heads/\\d+\\.\\d+\\.\\d+"],
    exclude_ref = "refs/heads/master",
)

list_view("infra", "Infra")
list_view("tryserver", "Tryserver")

luci.console_view_entry(builder = "ci/Auto-tag", category = "Tag", console_view = "br.stable")
luci.console_view_entry(builder = "ci/Auto-tag", category = "Tag", console_view = "br.beta")