<%@page import="java.io.InputStream"%>
<%@page import="java.net.URLEncoder"%>
<%@page import="org.w3c.dom.NodeList"%>
<%@page import="org.w3c.dom.Node"%>
<%@page import="org.w3c.dom.Element"%>
<%@page import="javax.xml.parsers.DocumentBuilderFactory"%>
<%@page import="org.w3c.dom.Document"%>
<%@page import="java.net.URL"%>

<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>향토음식</title>
</head>
<body>
<h4><strong> * 샘플화면은 디자인을 적용하지 않았으니, 개별 사이트의 스타일에 맞게 코딩하시기 바랍니다.</strong></h4>

<%
//레시피 상세조회
if(request.getParameter("cntntsNo")!=null && !request.getParameter("cntntsNo").equals("")){
	//apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
	String apiKey="발급받은인증키를삽입하세요";
	//서비스 명
	String serviceName="nvpcFdCkry";
	//오퍼레이션 명
	String operationName="fdNmDtl";

	//XML 받을 URL 생성
	String parameter = "/"+serviceName+"/"+operationName;
	parameter += "?apiKey="+ apiKey;
	parameter += "&cntntsNo="+ request.getParameter("cntntsNo");

	//서버와 통신
	URL apiUrl = new URL("http://api.nongsaro.go.kr/service"+parameter);
	InputStream apiStream = apiUrl.openStream();

	Document doc = null;
	try{
		//xml document
		doc = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(apiStream);
	}catch(Exception e){
		e.printStackTrace();
	}finally{
		apiStream.close();
	}
	//음식명
	String trditfdNm = null;
	//식품유형
	String foodTyCodeFullname = null;
	//조리법
	String ckryCodeFullname = null;
	//식재료
	String fdmtInfo = null;
	//부재료
	String asstnMatrlInfo = null;
	//조리방법
	String stdCkryDtl = null;
	//조리시연자
	String ckngDmprDtl = null;
	//참고사항
	String referMatterDtl = null;
	//출처
	String originDtl = null;
	//정보제공자
	String infoOfferInfo = null;
	//이미지구분코드
	String rtnImgSeCode = null;
	//이미지 경로
	String rtnFileCours = null;
	//이미지 물리명
	String rtnStreFileNm = null;

	try{trditfdNm = doc.getElementsByTagName("trditfdNm").item(0).getFirstChild().getNodeValue();}catch(Exception e){trditfdNm = "";}
	try{foodTyCodeFullname = doc.getElementsByTagName("foodTyCodeFullname").item(0).getFirstChild().getNodeValue();}catch(Exception e){foodTyCodeFullname = "";}
	try{ckryCodeFullname = doc.getElementsByTagName("ckryCodeFullname").item(0).getFirstChild().getNodeValue();}catch(Exception e){ckryCodeFullname = "";}
	try{fdmtInfo = doc.getElementsByTagName("fdmtInfo").item(0).getFirstChild().getNodeValue();}catch(Exception e){fdmtInfo = "";}
	try{asstnMatrlInfo = doc.getElementsByTagName("asstnMatrlInfo").item(0).getFirstChild().getNodeValue();}catch(Exception e){asstnMatrlInfo = "";}
	try{stdCkryDtl = doc.getElementsByTagName("stdCkryDtl").item(0).getFirstChild().getNodeValue();}catch(Exception e){stdCkryDtl = "";}
	try{ckngDmprDtl = doc.getElementsByTagName("ckngDmprDtl").item(0).getFirstChild().getNodeValue();}catch(Exception e){ckngDmprDtl = "";}
	try{referMatterDtl = doc.getElementsByTagName("referMatterDtl").item(0).getFirstChild().getNodeValue();}catch(Exception e){referMatterDtl = "";}
	try{originDtl = doc.getElementsByTagName("originDtl").item(0).getFirstChild().getNodeValue();}catch(Exception e){originDtl = "";}
	try{infoOfferInfo = doc.getElementsByTagName("infoOfferInfo").item(0).getFirstChild().getNodeValue();}catch(Exception e){infoOfferInfo = "";}
	try{rtnImgSeCode = doc.getElementsByTagName("rtnImgSeCode").item(0).getFirstChild().getNodeValue();}catch(Exception e){rtnImgSeCode = "";}
	try{rtnFileCours = doc.getElementsByTagName("rtnFileCours").item(0).getFirstChild().getNodeValue();}catch(Exception e){rtnFileCours = "";}
	try{rtnStreFileNm = doc.getElementsByTagName("rtnStreFileNm").item(0).getFirstChild().getNodeValue();}catch(Exception e){rtnStreFileNm = "";}

	%>
	<h2>전통향토음식 상세</h2>
	<div>
	<ul>
	<%
	String[] rtnStreFileNmArr = rtnStreFileNm.split("\\|");
	String[] rtnFileCoursArr = rtnFileCours.split("\\|");
	String[] rtnImgSeCodeArr= rtnImgSeCode.split("\\|");
	for(int i=0; i<rtnStreFileNmArr.length; i++){
		if("209006".equals(rtnImgSeCodeArr[i])){
			String imgUrl = "http://www.nongsaro.go.kr/"+ rtnFileCoursArr[i] +"/"+ rtnStreFileNmArr[i];
			%>
			<li style="width: 33%;display: inline-block;"><a href="#">
			<img src="<%=imgUrl%>" alt=""  title="" style="width: 249px;height: 198px;"/>
			</a></li>
			<%
		}

	}
	for(int i=0; i<rtnStreFileNmArr.length; i++){
		if("209005".equals(rtnImgSeCodeArr[i]) || "209007".equals(rtnImgSeCodeArr[i])){
			String imgUrl = "http://www.nongsaro.go.kr/"+ rtnFileCoursArr[i] +"/"+ rtnStreFileNmArr[i];
			%>
			<li style="width: 33%;display: inline-block;"><a href="#">
			<img src="<%=imgUrl%>" alt=""  title="" style="width: 249px;height: 198px;"/>
			</a></li>
			<%
		}
	}

%>
	</ul>
	</div>
	<!-- //이미지 갤러리 영역 -->
	<div>
		<!-- 내용 -->

		<table border="1" cellSpacing="0" cellPadding="0">
			<colgroup>
				<col style="width:20%" />
				<col/>
			</colgroup>
			<tbody>
				<tr>
					<td class="txt-c">음식명</td>
					<td><%=trditfdNm%></td>
				</tr>
				<tr>
					<td class="txt-c">식품유형</td>
					<td><%=foodTyCodeFullname%></td>
				</tr>
				<tr>
					<td class="txt-c">조리법</td>
					<td><%=ckryCodeFullname%></td>
				</tr>
				<tr>
					<td class="txt-c">식재료</td>
					<td><%=fdmtInfo%></td>
				</tr>
				<tr>
					<td class="txt-c">부재료</td>
					<td><%=asstnMatrlInfo%></td>
				</tr>
				<tr>
					<td class="txt-c">조리방법</td>
					<td><%=stdCkryDtl.replaceAll("\n", "<br/>")%></td>
				</tr>
				<tr>
					<td class="txt-c">조리시연자</td>
					<td><%=ckngDmprDtl%></td>
				</tr>
				<tr>
					<td class="txt-c">참고사항</td>
					<td><%=referMatterDtl%></td>
				</tr>
				<tr>
					<td class="txt-c">출처</td>
					<td><%=originDtl%></td>
				</tr>
				<tr>
					<td class="txt-c">정보제공자</td>
					<td><%=infoOfferInfo%></td>
				</tr>

		</table>
		<!--// 내용 -->
	</div>

<%} %>

<br>
<input type="button" onclick="javascript:location.href='fdNmLst.jsp'" value="처음화면으로"/>&nbsp;
</body>
</html>