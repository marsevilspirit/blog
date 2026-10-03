---
title: 'Switching from Shudong to JMS'
description: 'Codex tasks were eating into my 200 GB monthly allowance, so I switched to JMS and adjusted my Clash setup.'
pubDate: '2026-10-03T14:04:06+08:00'
---

My old Shudong plan cost ¥25 a month for 200 GB. Lately, I've been letting Codex run through plans and tasks for hours at a time, sometimes starting in the morning and carrying on into the evening. I often have the next task or conversation ready to go, and the data disappears fast.

When I checked my account, I'd used 181.18 GB and had just 18.82 GB left. I raised my budget to ¥50–100 a month and started looking for a plan with more data. I prefer US nodes, and I wanted to keep using Clash.

I also considered unlimited VPN plans and renting my own server. I'd want to try an unlimited plan on my usual connection first. Running a server myself would also mean keeping it maintained. I went with Just My Socks (JMS), and bought the LA 1000: at the time, it was listed at $9.88 a month for 1 TB, about five times my old allowance. [Plan details](https://justmysocks.net/members/cart.php)

JMS has a Mihomo / Clash.Meta subscription that imports straight into Clash Verge. Older Clash and ClashX versions don't support every protocol in the subscription; here's the provider's [compatibility note](https://justmysocks.net/members/index.php?rp=/announcements/34/Clash-support-added.html).

After importing it, I ran a speed test through Clash to Cloudflare on the afternoon of October 3. The test used about 80 MB of proxy traffic. I tried three single-connection downloads, four connections downloading at once, and two uploads:

| Test                                  | Result                     |
| ------------------------------------- | -------------------------- |
| Single-connection download, median    | 30.4 Mbps (about 3.8 MB/s) |
| Four simultaneous downloads, combined | 147 Mbps (about 18.4 MB/s) |
| Upload, average of two tests          | 18.1 Mbps (about 2.3 MB/s) |
| Node latency                          | about 100 ms               |

The three single-connection downloads ranged from 27.5 to 32 Mbps. The 147 Mbps figure is the combined speed of four connections; it isn't the speed of one download. For day-to-day Codex use, the single-connection number is closer to what I notice.

The automatic group picked node s4 for this test. Cloudflare showed that its exit was in Japan, despite the LA 1000 plan name. When I need a US exit, I choose a US node I've checked.

I also adjusted the routing rules after importing the profile. It originally ended with a single `MATCH,JMS` rule: requests that didn't match an earlier rule went through JMS. I added direct routes for Chinese domains, Chinese IP addresses, and the local network. AI traffic now has its own group, while other overseas traffic goes through a separate group that selects a node automatically. I reloaded the profile and checked the connection list; the routes matched what I expected.

I've selected the Japan s4 node for AI traffic. Other overseas traffic still uses automatic selection, which chooses a node based on latency. For long Codex runs, what I care about is whether the task finishes cleanly. A latency number alone can't tell me that.

I'll use JMS month to month for now. I want to see how much data Codex uses and whether long runs get interrupted before I decide whether to renew.
