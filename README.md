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
The skin object mentioned above can also be used from HTML skins.  It would look something like this:

    <object codetype="dotnetnuke/server" codebase="JavaScriptLibraryInclude">
        <param name="Name" value="jQuery" />
        <param name="Version" value="1.9.1" />
    </object>

License
---------------

This code is released under the [MIT license](LICENSE.md).  
However, the individual libraries are licensed by their respective owners.
