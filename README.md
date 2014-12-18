DNN JavaScript Libraries
===============

Version 7.2 of the [DNN Platform](http://www.dnnsoftware.com) introduced the
JavaScript Library extension type. This allows common JavaScript libraries to 
exist in a single place within a DNN site, instead of every module, skin, and 
piece of content that wants to include them using their own. DNN presently 
comes with libraries for jQuery, jQuery UI, jQuery Migrate, Knockout, and 
Knockout Mapping.

In addition to these built-in libraries, new libraries can be installed into 
DNN, and used by various components.  DNN allows multiple versions of a
JavaScript library to be used, so one module can request a particular version
of a script, while another requests another. So long as they aren't on the same
page, they will get what they requested; otherwise, DNN will use the higher 
version.


Goal
===============

The main benefits in using JavaScript Libraries are realized when they are used
by many separate components within a DNN site (i.e. when there is one common 
set of libraries and separate, unrelated DNN skins and modules use those 
libraries instead of packaging scripts directly into the extension). In order
to aid in that goal, we are attempting to create a central repository 
of common JavaScript Libraries that can be used by many different DNN extension
developers. 


Usage
===============

Skins
---------------
Starting in DNN 7.3, there is a skin object called `JavaScriptLibraryInclude`
which can be used to request a JavaScript library (including jQuery, but also
any 3rd party library) from a skin. To do that, you need to register the skin
object at the top of your skin:

    <%@ Register TagPrefix="dnn" TagName="JavaScriptLibraryInclude" Src="~/admin/Skins/JavaScriptLibraryInclude.ascx" %>

Then, in the body of the skin, use the skin object to request the library:

    <dnn:JavaScriptLibraryInclude runat="server" Name="jQuery" />
    <dnn:JavaScriptLibraryInclude runat="server" Name="jQuery-UI" Version="1.10.3" />
    <dnn:JavaScriptLibraryInclude runat="server" Name="jQuery-Migrate" Version="1.2.1" SpecificVersion="LatestMajor" />

HTML Skins
---------------
The skin object mentioned above can also be used from HTML skins.  It would 
look something like this:

    <object codetype="dotnetnuke/server" codebase="JavaScriptLibraryInclude">
        <param name="Name" value="jQuery" />
        <param name="Version" value="1.9.1" />
    </object>
    
Code
---------------
There is also an API to request JavaScript Libraries from code.  This is needed
in skins prior to DNN 7.3 and the introduction of the `JavaScriptLibraryInclude`
skin object, as well as from extension code (though extensions can also make use 
of the skin object, if desired).  The primary entry point for the API is the
`RequestRegistration` method of the `JavaScript` static class in the 
`DotNetNuke.Framework.JavaScriptLibraries` namespace.  There are three overloads
to `RequestRegistration`:

    JavaScript.RequestRegistration(String libraryName)
    JavaScript.RequestRegistration(String libraryName, Version version)
    JavaScript.RequestRegistration(String libraryName, Version version, SpecificVersion specificity)

The overload which doesn't specify a version will request the latest version of
the library. In order to avoid your extensions breaking unexpectedly, it's 
probably best to always specify a version number.  The second overload, which 
includes the version number will request that specific version of the library.
If that version isn't installed, it will instead display an error.  The third
overload is probably the best to use for most scenarios. It allows you to pass
a value indicating how specific the version is, as a value of the 
`SpecificVersion` enum.  The possible values are `Latest`, `LatestMajor`, 
`LatestMinor`, and `Exact`.  `Latest` is the behavior of the overload with one 
argument, `Exact` is the behavior of the overload with two arguments, while the 
other two values allow you to get behavior that is in between strict and loose. 


JavaScript Library Features
===============

When requesting that a JavaScript Library is registered, DNN ensures that 
both that library's JavaScript file and all of its dependencies' JavaScript 
files, get included on the page. The JavaScript library itself will define the
properties that determine how the file is included on the page.  Specifically,
the library will indicate its preferred location (from page head, body top, and
body bottom), and can provide a URL to the script on a 
<abbr title="Content Distribution Network">CDN</abbr> (along with a JavaScript
expression to use to verify that the CDN loaded the script correctly, so that
DNN can fallback to the local version if the CDN is down). The host
administrator can configure whether to use the CDN or not (it is off by 
default).

The other main feature that JavaScript Libraries give you is de-duplication of
scripts.  This means that if your module and your skin both request the 
[html5shiv library](http://www.dnnsoftware.com/forge/html5shiv), it only gets
included on the page once (rather than both components including their own 
version of the script).  Likewise, if both components request different versions
of the script, just the higher version will be included.


Roadmap
===============

The obvious next step for this project is to add more libraries.  There's a 
short list in [the Issues list for this repo](/EngageSoftware/DNN-JavaScript-Libraries/issues),
but we would eventually like to make it very easy to add any reusable script to
the repository. To do that, we'll need to invest in better integration with a
script package manager, probably [Bower](http://bower.io/), so that with very
little effort, we can get the latest version of a script, package it, and 
publish it.

In addition, there are some enhancements to DNN itself that would help this be
an even more useful tool. The main enhancement is to provide a similar mechanism
for shared CSS components. For example, many jQuery plugins are going to include
basic styles to make them work. It would be nice if there was a way to get CSS
that matched the requested JavaScript Library.  Also, JavaScript libraries with 
multiple JavaScript files could be handled together more cleanly, rather than as
a bunch of separate libraries.  Finally, one of the big ways that would make 
this more of a no-brainer is if the extension installation process automatically
found dependent packages on the [DNN Forge](http://www.dnnsoftware.com/forge) 
rather than asking clients to install the JavaScript Library package(s) before 
installing your component.

	
License
===============

This code is released under the [MIT license](LICENSE.md).  
However, the individual libraries are licensed by their respective owners.
